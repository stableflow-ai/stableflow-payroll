/**
 * Multi-chain wallet abstraction for Stableflow Pay.
 *
 * Admins connect a wallet per chain to broadcast backend-prepared payouts.
 * Employees no longer connect a wallet.
 */

export type ChainKind = "evm" | "near" | "solana" | "tron";

export const CHAIN_KINDS: ChainKind[] = ["evm", "near", "solana", "tron"];

/** Connected address for each chain currently linked in this browser session. */
export type ChainOwners = Partial<Record<ChainKind, string>>;

export interface WalletAccount {
  address: string;
  chainKind: ChainKind;
  chainId?: string | number;
}

export interface WalletAdapter {
  readonly kind: ChainKind;
  connect(): Promise<void> | void;
  disconnect(): Promise<void> | void;
  getAccount(): WalletAccount | null;
  isAddressValid(address: string): boolean;
}

export interface UseWalletResult {
  kind: ChainKind;
  account: WalletAccount | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  disconnect: () => void;
  isAddressValid: (address: string) => boolean;
  isModalOpen?: boolean;
}

export class UnsupportedChainError extends Error {
  constructor(kind: ChainKind, action: string) {
    super(
      `[wallet] Chain "${kind}" is not implemented yet (action: ${action}). ` +
        `Add an adapter under src/wallet/${kind}/ and register it in WalletProvider.`,
    );
    this.name = "UnsupportedChainError";
  }
}
