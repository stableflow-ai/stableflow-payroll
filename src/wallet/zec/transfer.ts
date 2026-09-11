import { formatUnits } from "viem";
import { assertNativeZecSpendable } from "./balance";
import { ZEC_DECIMALS, ZEC_SHIELD_FUNDS_MESSAGE } from "./config";
import { zcashWalletAdapter } from "./sdk";

export async function transferNativeZec(input: {
  to: string;
  amountIn: bigint;
  decimals?: number;
}): Promise<string> {
  const decimals = input.decimals ?? ZEC_DECIMALS;
  await assertNativeZecSpendable(input.amountIn);
  const amount = formatUnits(input.amountIn, decimals);
  try {
    return await zcashWalletAdapter.signAndSendTransaction({
      to: input.to,
      amount,
      fundingSource: "shielded",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error || "");
    if (/shield|funding|insufficient|balance/i.test(msg)) {
      throw new Error(ZEC_SHIELD_FUNDS_MESSAGE);
    }
    throw error;
  }
}
