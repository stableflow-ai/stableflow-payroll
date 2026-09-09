import { Big } from "@/utils";
import { ZEC_DECIMALS } from "./config";
import { getBalanceZec } from "./sdk";

export async function readNativeZecBalance(): Promise<bigint> {
  const balance = await getBalanceZec();
  const available = balance.available || "0";
  try {
    return BigInt(new Big(available).times(new Big(10).pow(ZEC_DECIMALS)).toFixed(0));
  } catch {
    return 0n;
  }
}
