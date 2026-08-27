import type { IntentsToken } from "@/stores/intents-tokens";

/** USD value of a token balance using `/v0/tokens` price. Unknown balance is -1 (sort last). */
export function tokenBalanceUsd(
  token: Pick<IntentsToken, "price">,
  formatted: string | null | undefined,
): number {
  if (formatted == null || formatted === "") return -1;
  const amount = Number(formatted);
  if (!Number.isFinite(amount)) return -1;
  const price = Number(token.price);
  return amount * (Number.isFinite(price) ? price : 0);
}
