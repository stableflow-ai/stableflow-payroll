import { WalletConnectWallet } from "@walletconnect/solana-adapter/core";
import {
  SOLANA_WC_DEPRECATED_MAINNET_CHAIN,
  SOLANA_WC_MAINNET_CHAIN,
} from "./config";
import {
  hasSolanaAccount,
  waitForWalletConnectSession,
  type WalletConnectSession,
} from "./walletconnect-session";

type WalletConnectProvider = {
  session?: WalletConnectSession;
  connect: (params: unknown) => Promise<WalletConnectSession | undefined>;
  setDefaultChain: (chain: string) => void;
  on?: (event: string, listener: (uri: string) => void) => void;
  off?: (event: string, listener: (uri: string) => void) => void;
};

type WalletConnectModal = {
  open: () => void;
  close: () => void;
  subscribeState: (callback: (state: { open?: boolean }) => void) => (() => void) | void;
};

type WalletConnectWalletInternal = {
  _UniversalProvider?: WalletConnectProvider;
  _session?: WalletConnectSession;
  _modal?: WalletConnectModal;
  _network: string;
  _ConnectQueueResolver?: (value: unknown) => void;
  initModal: () => Promise<void>;
  publicKey: WalletConnectWallet["publicKey"];
};

let patched = false;
let displayUriHandler: ((uri: string) => void) | null = null;
let silentConnect = false;

export function setWalletConnectDisplayUriHandler(handler: ((uri: string) => void) | null) {
  displayUriHandler = handler;
}

export function setSilentWalletConnectConnect(silent: boolean) {
  silentConnect = silent;
}

export class WalletConnectSilentConnectError extends Error {
  constructor() {
    super("No WalletConnect session");
    this.name = "WalletConnectSilentConnectError";
  }
}

function getConnectParams(network: string) {
  const chains = network === SOLANA_WC_DEPRECATED_MAINNET_CHAIN
    ? [SOLANA_WC_DEPRECATED_MAINNET_CHAIN, SOLANA_WC_MAINNET_CHAIN]
    : [SOLANA_WC_MAINNET_CHAIN, SOLANA_WC_DEPRECATED_MAINNET_CHAIN];
  return {
    optionalNamespaces: {
      solana: {
        chains,
        methods: ["solana_signTransaction", "solana_signMessage"],
        events: [] as string[],
      },
    },
  };
}

function chainFromAccount(account: string) {
  const parts = account.split(":");
  return parts.length >= 2 ? `solana:${parts[1]}` : "";
}

function applySession(wallet: WalletConnectWalletInternal, session: WalletConnectSession) {
  wallet._session = session;
  const accounts = session.namespaces?.solana?.accounts ?? [];
  const chains = accounts.map(chainFromAccount);
  const nextNetwork = chains.includes(SOLANA_WC_MAINNET_CHAIN)
    ? SOLANA_WC_MAINNET_CHAIN
    : chains.includes(SOLANA_WC_DEPRECATED_MAINNET_CHAIN)
      ? SOLANA_WC_DEPRECATED_MAINNET_CHAIN
      : wallet._network;
  wallet._network = nextNetwork;
  wallet._UniversalProvider?.setDefaultChain(nextNetwork);
  return { publicKey: wallet.publicKey };
}

async function patchedConnect(this: WalletConnectWalletInternal) {
  if (!this._UniversalProvider) {
    await new Promise((resolve) => {
      this._ConnectQueueResolver = resolve;
    });
  }
  if (!this._UniversalProvider) {
    throw new Error("WalletConnect Adapter - Universal Provider was undefined while calling 'connect()'");
  }

  const existing = this._UniversalProvider.session;
  if (hasSolanaAccount(existing)) {
    return applySession(this, existing);
  }
  if (silentConnect) {
    throw new WalletConnectSilentConnectError();
  }

  await this.initModal();
  const provider = this._UniversalProvider;
  const modal = this._modal;
  const session = await waitForWalletConnectSession({
    connectProvider: () => provider.connect(getConnectParams(this._network)),
    getSession: () => provider.session,
    subscribeModalState: (callback) => modal?.subscribeState((state: { open?: boolean }) => {
      callback(Boolean(state.open));
    }),
    openModal: () => {
      modal?.open();
    },
    closeModal: () => {
      modal?.close();
    },
    subscribeDisplayUri: (callback) => {
      provider.on?.("display_uri", callback);
      return () => provider.off?.("display_uri", callback);
    },
    onDisplayUri: (uri) => {
      displayUriHandler?.(uri);
    },
  });
  return applySession(this, session);
}

export function installSolanaWalletConnectConnectPatch() {
  if (patched) return;
  patched = true;
  WalletConnectWallet.prototype.connect = patchedConnect as typeof WalletConnectWallet.prototype.connect;
}
