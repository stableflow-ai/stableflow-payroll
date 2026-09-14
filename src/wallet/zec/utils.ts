import { UserRejectedError, WalletNotFoundError } from "@rhea-finance/zcash-wallet-adapter";
import { NOIR_DOWNLOAD_URL } from "./config";

export function isNoirWalletUnavailable(error: unknown): boolean {
  if (error instanceof WalletNotFoundError) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /no wallets available to authorize/i.test(message);
}

export function isNoirWalletRejected(error: unknown): boolean {
  if (error instanceof UserRejectedError) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /user rejected|user denied|rejected the request/i.test(message);
}

export function openNoirInstallPage() {
  window.open(NOIR_DOWNLOAD_URL, "_blank", "noopener,noreferrer");
}
