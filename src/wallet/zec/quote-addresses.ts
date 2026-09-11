export interface ZecQuoteAddresses {
  payer: string;
  refundTo: string;
}

export function nonemptyZecAddress(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

/** Quote needs both a shielded payer and a transparent refund address. */
export function zecQuoteAddressesFrom(
  shielded: string | null | undefined,
  transparent: string | null | undefined,
): ZecQuoteAddresses | null {
  const payer = nonemptyZecAddress(shielded);
  const refundTo = nonemptyZecAddress(transparent);
  if (!payer || !refundTo) return null;
  return { payer, refundTo };
}
