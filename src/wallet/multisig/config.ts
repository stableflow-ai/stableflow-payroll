export const MULTISIG_LISTEN_TITLE = "Waiting for multisig signatures";
export const MULTISIG_SIGNED_LABEL = "signed";
export const MULTISIG_FAILED_MESSAGE = "Multisig transaction failed";
export const MULTISIG_QUOTE_EXPIRED_MESSAGE = "Quote expired";
export const MULTISIG_SUBMIT_FAILED_MESSAGE = "Could not submit the payment";
export const MULTISIG_WATCH_STORAGE_KEY = "stableflow-pay:multisig-watch:v1";

export function txHashForSubmit(txHash: string | null | undefined): string {
  return txHash?.trim() ?? "";
}
