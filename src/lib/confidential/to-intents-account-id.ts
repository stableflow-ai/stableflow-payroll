import { authIdentity } from "@defuse-protocol/internal-utils";
import type { ChainKind } from "@/wallet";

/**
 * Convert a chain address into the NEAR Intents account id via
 * `@defuse-protocol/internal-utils` `authHandleToIntentsUserId`.
 */
export function toIntentsAccountId(address: string, chainKind: ChainKind): string {
  const value = address.trim();
  if (!value) throw new Error("Invalid wallet address");
  return authIdentity.authHandleToIntentsUserId(value, chainKind);
}
