/**
 * Tron native TRX and TRC-20 transfers to a deposit address.
 */

import { getTronWeb } from "@/lib/rpc/tron";
import { INSUFFICIENT_APPROVAL_AMOUNT_MESSAGE } from "@/wallet/config";
import {
  TRON_BROADCAST_EXPIRED_MESSAGE,
  TRON_BROADCAST_FAILED_PREFIX,
  TRON_CONFIRM_MAX_RETRIES,
  TRON_CONFIRM_RETRY_DELAY_MS,
  TRON_CONFIRM_TIMEOUT_MESSAGE,
  TRON_FEE_LIMIT_SUN,
  TRON_LEDGER_ADAPTER_NAME,
  TRON_TX_EXPIRATION_MS,
  TRON_TX_FAILED_PREFIX,
  LEDGER_SIGN_GAP_MS,
} from "./config";
import { getTronSigner } from "./session";
import { tronWalletErrorMessage } from "./utils";

function requireSigner() {
  const signer = getTronSigner();
  if (!signer) throw new Error("Connect a Tron wallet to send this payout");
  return signer;
}

type TronUnsignedTx = {
  txID?: string;
  raw_data?: {
    expiration?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type TronBroadcastResult = {
  result?: boolean | { result?: boolean };
  code?: string;
  message?: string;
  txid?: string;
  transaction?: { txID?: string };
};

function decodeTronBroadcastMessage(message: string | undefined): string {
  const trimmed = String(message || "").trim();
  if (!trimmed) return "";
  if (trimmed.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(trimmed)) return trimmed;
  try {
    const text = trimmed.replace(/../g, (pair) => String.fromCharCode(Number.parseInt(pair, 16)));
    return /^[\x20-\x7E]+$/.test(text) ? text : trimmed;
  } catch {
    return trimmed;
  }
}

function isTronBroadcastExpired(code: string, message: string): boolean {
  const combined = `${code} ${message}`.toUpperCase();
  return combined.includes("TRANSACTION_EXPIRATION")
    || combined.includes("TRANSACTION_EXPIRED")
    || (combined.includes("EXPIRED") && combined.includes("TRANSACTION"));
}

function isBroadcastOk(result: TronBroadcastResult["result"]): boolean {
  return result === true || (typeof result === "object" && result?.result === true);
}

export function assertTronBroadcastAccepted(result: unknown): string {
  const body = (result ?? {}) as TronBroadcastResult;
  const hash = body.txid || body.transaction?.txID || "";
  if (isBroadcastOk(body.result)) {
    if (!hash) throw new Error("Tron wallet did not return a transaction hash");
    return hash;
  }
  const code = String(body.code ?? "");
  const message = decodeTronBroadcastMessage(body.message);
  if (isTronBroadcastExpired(code, message)) {
    throw new Error(TRON_BROADCAST_EXPIRED_MESSAGE);
  }
  const detail = [code, message].filter(Boolean).join(": ");
  throw new Error(
    detail ? `${TRON_BROADCAST_FAILED_PREFIX}${detail}` : `${TRON_BROADCAST_FAILED_PREFIX}unknown error`,
  );
}

async function defaultNewTxID(tx: unknown): Promise<unknown> {
  return getTronWeb().transactionBuilder.newTxID(tx as never, { txLocal: true });
}

export async function withTronExpiration(
  unsigned: unknown,
  options?: {
    now?: number;
    newTxID?: (tx: unknown) => Promise<unknown>;
  },
): Promise<unknown> {
  const tx = unsigned as TronUnsignedTx;
  if (!tx?.raw_data) return unsigned;
  const prepared: TronUnsignedTx = {
    ...tx,
    raw_data: {
      ...tx.raw_data,
      expiration: (options?.now ?? Date.now()) + TRON_TX_EXPIRATION_MS,
    },
  };
  delete prepared.raw_data_hex;
  const newTxID = options?.newTxID ?? defaultNewTxID;
  return newTxID(prepared);
}

let lastLedgerSignSettledAt = 0;

function isLedgerSigner(signer: { adapterName?: string }): boolean {
  return signer.adapterName === TRON_LEDGER_ADAPTER_NAME;
}

async function waitForLedgerSignGap(signer: { adapterName?: string }): Promise<void> {
  if (!isLedgerSigner(signer) || lastLedgerSignSettledAt === 0) return;
  const elapsed = Date.now() - lastLedgerSignSettledAt;
  if (elapsed < LEDGER_SIGN_GAP_MS) await sleep(LEDGER_SIGN_GAP_MS - elapsed);
}

async function broadcastSigned(unsigned: unknown): Promise<string> {
  const signer = requireSigner();
  let tronWeb = getTronWeb();
  tronWeb.setAddress(signer.address);
  const prepared = await withTronExpiration(unsigned);
  await waitForLedgerSignGap(signer);
  try {
    const signed = await signer.signTransaction(prepared as Parameters<typeof signer.signTransaction>[0]);
    tronWeb = getTronWeb();
    tronWeb.setAddress(signer.address);
    return assertTronBroadcastAccepted(await tronWeb.trx.sendRawTransaction(signed));
  } catch (error) {
    const mapped = tronWalletErrorMessage(error);
    if (mapped) throw new Error(mapped);
    throw error;
  } finally {
    if (isLedgerSigner(signer)) lastLedgerSignSettledAt = Date.now();
  }
}

export async function transferNativeTrx(input: {
  to: string;
  amountIn: bigint;
}): Promise<string> {
  const signer = requireSigner();
  const tronWeb = getTronWeb();
  tronWeb.setAddress(signer.address);
  const transaction = await tronWeb.transactionBuilder.sendTrx(
    input.to,
    Number(input.amountIn),
    signer.address,
  );
  return broadcastSigned(transaction);
}

function toTronInput(callData: string): string {
  const trimmed = callData.trim();
  if (!trimmed) throw new Error("Missing call data");
  return trimmed.replace(/^0x/i, "");
}

function toTronCallValue(amount: bigint): number {
  if (amount < 0n || amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Tron call value exceeds safe integer range");
  }
  return Number(amount);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

type TronTxInfo = {
  id?: string;
  result?: string;
  receipt?: { result?: string };
};

function defaultGetTransactionInfo(txid: string): Promise<TronTxInfo> {
  return getTronWeb().trx.getTransactionInfo(txid) as Promise<TronTxInfo>;
}

function isTronTxFailedError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith(TRON_TX_FAILED_PREFIX);
}

export function isTronConfirmTimeout(error: unknown): boolean {
  return error instanceof Error && error.message === TRON_CONFIRM_TIMEOUT_MESSAGE;
}

export async function waitForTronSuccess(
  txid: string,
  options?: {
    getTransactionInfo?: (txid: string) => Promise<TronTxInfo | null | undefined>;
    sleep?: (ms: number) => Promise<void>;
    maxRetries?: number;
    retryDelayMs?: number;
  },
): Promise<void> {
  const getTransactionInfo = options?.getTransactionInfo ?? defaultGetTransactionInfo;
  const wait = options?.sleep ?? sleep;
  const maxRetries = options?.maxRetries ?? TRON_CONFIRM_MAX_RETRIES;
  const retryDelayMs = options?.retryDelayMs ?? TRON_CONFIRM_RETRY_DELAY_MS;

  for (let retryIndex = 0; retryIndex < maxRetries; retryIndex++) {
    await wait(retryDelayMs);
    try {
      const info = await getTransactionInfo(txid);
      const result = info?.receipt?.result;
      if (result === "SUCCESS") return;
      if (result) throw new Error(`${TRON_TX_FAILED_PREFIX}${result}`);
    } catch (error) {
      if (isTronTxFailedError(error)) throw error;
    }
  }
  throw new Error(TRON_CONFIRM_TIMEOUT_MESSAGE);
}

export async function waitForTronApproveReady(input: {
  txid: string;
  requiredAmount: bigint;
  readAllowance: () => Promise<bigint>;
  getTransactionInfo?: (txid: string) => Promise<TronTxInfo | null | undefined>;
  sleep?: (ms: number) => Promise<void>;
  maxRetries?: number;
  retryDelayMs?: number;
}): Promise<void> {
  const getTransactionInfo = input.getTransactionInfo ?? defaultGetTransactionInfo;
  const wait = input.sleep ?? sleep;
  const maxRetries = input.maxRetries ?? TRON_CONFIRM_MAX_RETRIES;
  const retryDelayMs = input.retryDelayMs ?? TRON_CONFIRM_RETRY_DELAY_MS;

  for (let retryIndex = 0; retryIndex < maxRetries; retryIndex++) {
    try {
      const allowance = await input.readAllowance();
      if (allowance >= input.requiredAmount) return;
    } catch {
      // Keep polling until the window elapses.
    }
    try {
      const info = await getTransactionInfo(input.txid);
      const result = info?.receipt?.result;
      if (result && result !== "SUCCESS") {
        throw new Error(`${TRON_TX_FAILED_PREFIX}${result}`);
      }
    } catch (error) {
      if (isTronTxFailedError(error)) throw error;
    }
    if (retryIndex === maxRetries - 1) break;
    await wait(retryDelayMs);
  }
  throw new Error(INSUFFICIENT_APPROVAL_AMOUNT_MESSAGE);
}

export async function broadcastTronCallData(input: {
  contract: string;
  callData: string;
  callValue?: bigint;
}): Promise<string> {
  const signer = requireSigner();
  const tronWeb = getTronWeb();
  tronWeb.setAddress(signer.address);
  const tx = await tronWeb.transactionBuilder.triggerSmartContract(
    input.contract,
    "",
    {
      callValue: toTronCallValue(input.callValue ?? 0n),
      feeLimit: TRON_FEE_LIMIT_SUN,
      input: toTronInput(input.callData),
    },
    [],
    signer.address,
  );
  const wrapper = tx as { result?: { result?: boolean }; transaction?: unknown };
  if (wrapper.result && wrapper.result.result === false) {
    throw new Error("Tron contract call could not be created");
  }
  const transaction = wrapper.transaction ?? tx;
  return broadcastSigned(transaction);
}

export async function transferTrc20(input: {
  contractAddress: string;
  to: string;
  amountIn: bigint;
}): Promise<string> {
  const signer = requireSigner();
  const tronWeb = getTronWeb();
  tronWeb.setAddress(signer.address);
  const tx = await tronWeb.transactionBuilder.triggerSmartContract(
    input.contractAddress,
    "transfer(address,uint256)",
    {},
    [
      { type: "address", value: input.to },
      { type: "uint256", value: input.amountIn.toString() },
    ],
    signer.address,
  );
  const transaction = (tx as { transaction?: unknown }).transaction ?? tx;
  return broadcastSigned(transaction);
}
