import { create } from "zustand";
import { isAddressValid } from "@/utils";
import {
  CHAIN_KINDS,
  type ChainKind,
  type ChainOwners,
  type IntentSignInput,
  type IntentSignedPayload,
  type WalletAccount,
} from "@/wallet/types";

export interface ChainWalletState {
  account: WalletAccount | null;
  connecting: boolean;
  modalOpen: boolean;
}

export interface ChainWalletActions {
  connect: () => void;
  disconnect: () => void;
  signMessage: (input: IntentSignInput) => Promise<IntentSignedPayload>;
}

const EMPTY_CHAIN: ChainWalletState = {
  account: null,
  connecting: false,
  modalOpen: false,
};

function emptyChains(): Record<ChainKind, ChainWalletState> {
  return {
    evm: { ...EMPTY_CHAIN },
    near: { ...EMPTY_CHAIN },
    solana: { ...EMPTY_CHAIN },
    tron: { ...EMPTY_CHAIN },
  };
}

function ownersFromChains(chains: Record<ChainKind, ChainWalletState>): ChainOwners {
  const owners: ChainOwners = {};
  for (const kind of CHAIN_KINDS) {
    const address = chains[kind].account?.address;
    if (address) owners[kind] = address;
  }
  return owners;
}

interface WalletStore {
  chains: Record<ChainKind, ChainWalletState>;
  owners: ChainOwners;
  actions: Partial<Record<ChainKind, ChainWalletActions>>;
  sync: (kind: ChainKind, slice: ChainWalletState) => void;
  registerActions: (kind: ChainKind, actions: ChainWalletActions) => void;
  connect: (kind: ChainKind) => void;
  disconnect: (kind: ChainKind) => void;
  signMessage: (kind: ChainKind, input: IntentSignInput) => Promise<IntentSignedPayload>;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  chains: emptyChains(),
  owners: {},
  actions: {},
  sync: (kind, slice) => {
    set((state) => {
      const chains = { ...state.chains, [kind]: slice };
      return { chains, owners: ownersFromChains(chains) };
    });
  },
  registerActions: (kind, actions) => {
    set((state) => ({
      actions: { ...state.actions, [kind]: actions },
    }));
  },
  connect: (kind) => {
    get().actions[kind]?.connect();
  },
  disconnect: (kind) => {
    get().actions[kind]?.disconnect();
  },
  signMessage: (kind, input) => {
    const signMessage = get().actions[kind]?.signMessage;
    if (!signMessage) {
      throw new Error(`[wallet] Chain "${kind}" is not ready to sign messages.`);
    }
    return signMessage(input);
  },
}));

export function walletAddressValid(kind: ChainKind, address: string): boolean {
  return isAddressValid(address, kind);
}
