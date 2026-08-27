/**
 * Tron native TRX and TRC-20 transfers to a deposit address.
 */

import { getTronWeb } from "@/lib/rpc/tron";
import {
  TRON_CONFIRM_MAX_RETRIES,
  TRON_CONFIRM_RETRY_DELAY_MS,
  TRON_FEE_LIMIT_SUN,
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

export async function waitForTronSuccess(txid: string): Promise<void> {
  const tronWeb = getTronWeb();
  for (let retryIndex = 0; retryIndex < TRON_CONFIRM_MAX_RETRIES; retryIndex++) {
    await sleep(TRON_CONFIRM_RETRY_DELAY_MS);
    const info = await tronWeb.trx.getTransactionInfo(txid) as {
      id?: string;
      result?: string;
      receipt?: { result?: string };
    };
    if (!info?.id) continue;
    const result = info.receipt?.result || info.result;
    if (!result || result === "SUCCESS") return;
    throw new Error(`Tron transaction failed: ${result}`);
  }
  throw new Error("Tron transaction confirmation timed out");
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
