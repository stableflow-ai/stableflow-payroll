import { Big } from "@/utils";
import { ZEC_DECIMALS } from "./config";
import { zcashWalletAdapter } from "./sdk";

export async function readNativeZecBalance(): Promise<bigint> {
  const balance = await zcashWalletAdapter.getBalance();
  const shielded = balance.shielded || "0";
  try {
    return BigInt(new Big(shielded).times(new Big(10).pow(ZEC_DECIMALS)).toFixed(0));
  } catch {
    return 0n;
  }
}
