import { getNoirWallet, isNoirWalletInstalled } from "@noir-wallet/sdk";
import type { Balance, ZcashConnectResult } from "@noir-wallet/sdk";

export { isNoirWalletInstalled };

export function getZecWallet() {
  const wallet = getNoirWallet();
  if (!wallet) {
    throw new Error("Noir Wallet not installed");
  }
  return wallet.zcash;
}

export async function connectZec(): Promise<ZcashConnectResult> {
  return await getZecWallet().connect();
}

export async function getAccountsZec(): Promise<ZcashConnectResult | null> {
  return await getZecWallet().getAccounts();
}

export async function getBalanceZec(): Promise<Balance> {
  return await getZecWallet().getBalance();
}

export async function transferZec(input: { to: string; amount: string }): Promise<string> {
  return await getZecWallet().sendTransaction(input);
}

export async function disconnectZec(): Promise<void> {
  try {
    await getZecWallet().disconnect();
  } catch {
    // ignore disconnect errors when the extension is unavailable
  }
}
