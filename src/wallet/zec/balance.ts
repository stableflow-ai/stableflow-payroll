import { Big } from "@/utils";
import {
  ZEC_CONFIRMING_MESSAGE,
  ZEC_DECIMALS,
  ZEC_INSUFFICIENT_BALANCE_MESSAGE,
} from "./config";
import { zcashWalletAdapter } from "./sdk";

type ZecBalanceFields = {
  shielded?: string;
  available?: string;
  spendable?: string;
};

function zecToRaw(value: string): bigint {
  try {
    return BigInt(new Big(value || "0").times(new Big(10).pow(ZEC_DECIMALS)).toFixed(0));
  } catch {
    return 0n;
  }
}

export function spendableZecFrom(balance: ZecBalanceFields): bigint {
  return zecToRaw(balance.available || balance.spendable || balance.shielded || "0");
}

export function shieldedZecFrom(balance: ZecBalanceFields): bigint {
  return zecToRaw(balance.shielded || "0");
}

export async function readNativeZecFunding(): Promise<{ available: bigint; shielded: bigint }> {
  const balance = await zcashWalletAdapter.getBalance();
  return {
    available: spendableZecFrom(balance),
    shielded: shieldedZecFrom(balance),
  };
}

export async function readNativeZecBalance(): Promise<bigint> {
  const { available } = await readNativeZecFunding();
  return available;
}

export async function assertNativeZecSpendable(amountIn: bigint): Promise<void> {
  const { available, shielded } = await readNativeZecFunding();
  if (available >= amountIn) return;
  if (shielded >= amountIn) throw new Error(ZEC_CONFIRMING_MESSAGE);
  throw new Error(ZEC_INSUFFICIENT_BALANCE_MESSAGE);
}

export function zecSpendableGateMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === ZEC_CONFIRMING_MESSAGE) return ZEC_CONFIRMING_MESSAGE;
    if (error.message === ZEC_INSUFFICIENT_BALANCE_MESSAGE) return ZEC_INSUFFICIENT_BALANCE_MESSAGE;
  }
  return "Could not read wallet balance";
}
