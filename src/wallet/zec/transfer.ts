import { formatUnits } from "viem";
import { ZEC_DECIMALS, ZEC_SHIELD_FUNDS_MESSAGE } from "./config";
import { transferZec } from "./sdk";

export async function transferNativeZec(input: {
  to: string;
  amountIn: bigint;
  decimals?: number;
}): Promise<string> {
  const decimals = input.decimals ?? ZEC_DECIMALS;
  const amount = formatUnits(input.amountIn, decimals);
  try {
    return await transferZec({ to: input.to, amount });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error || "");
    if (/shield|funding|insufficient|balance/i.test(msg)) {
      throw new Error(ZEC_SHIELD_FUNDS_MESSAGE);
    }
    throw error;
  }
}
