/**
 * Tron native TRX and TRC-20 transfers to a deposit address.
 */

import { getTronWeb } from "@/lib/rpc/tron";
import {
  TRON_CONFIRM_MAX_RETRIES,
  TRON_CONFIRM_RETRY_DELAY_MS,
  TRON_CONFIRM_TIMEOUT_MESSAGE,
  TRON_FEE_LIMIT_SUN,
  TRON_TX_FAILED_PREFIX,
} from "./config";
import { getTronSigner } from "./session";

function requireSigner() {
  const signer = getTronSigner();
  if (!signer) throw new Error("Connect a Tron wallet to send this payout");
  return signer;
}

async function broadcastSigned(unsigned: unknown): Promise<string> {
  const signer = requireSigner();
  const tronWeb = getTronWeb();
  tronWeb.setAddress(signer.address);
  const signed = await signer.signTransaction(unsigned as Parameters<typeof signer.signTransaction>[0]);
  const result = await tronWeb.trx.sendRawTransaction(signed);
  const hash = (result as { txid?: string; transaction?: { txID?: string } })?.txid
    || (result as { transaction?: { txID?: string } })?.transaction?.txID;
  if (!hash) throw new Error("Tron wallet did not return a transaction hash");
  return hash;
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
