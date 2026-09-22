import { WalletConnectWallet } from "@walletconnect/solana-adapter/core";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { SOLANA_WC_MAINNET_CHAIN, SOLANA_WC_SESSION_POLL_MS, SOLANA_WC_SILENT_SESSION_TIMEOUT_MS } from "./config";
import {
  hasExistingSolanaWalletConnectSession,
  installSolanaWalletConnectConnectPatch,
  peekExistingSolanaWalletConnectSession,
  setSilentWalletConnectConnect,
  WalletConnectSilentConnectError,
} from "./walletconnect-connect";

const SOLANA_SESSION = {
  namespaces: {
    solana: {
      accounts: [`${SOLANA_WC_MAINNET_CHAIN}:Demo111111111111111111111111111111111111111`],
    },
  },
};

type WalletConnectProvider = {
  session?: typeof SOLANA_SESSION;
  connect: ReturnType<typeof vi.fn>;
  setDefaultChain: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
};

function createWallet(session?: typeof SOLANA_SESSION) {
  const provider: WalletConnectProvider = {
    session,
    connect: vi.fn(),
    setDefaultChain: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };
  const initModal = vi.fn();
  const publicKey = { toBase58: () => "Demo" };
  return {
    wallet: {
      _UniversalProvider: provider,
      _session: undefined as typeof SOLANA_SESSION | undefined,
      _modal: {
        open: vi.fn(),
        close: vi.fn(),
        subscribeState: vi.fn(),
      },
      _network: SOLANA_WC_MAINNET_CHAIN,
      initModal,
      publicKey,
    },
    provider,
    initModal,
    publicKey,
  };
}

describe("silent WalletConnect connect", () => {
  beforeAll(() => {
    installSolanaWalletConnectConnectPatch();
  });

  afterEach(() => {
    setSilentWalletConnectConnect(false);
  });

  it("restores a Solana session without opening the WalletConnect modal", async () => {
    setSilentWalletConnectConnect(true);
    const { wallet, initModal, provider, publicKey } = createWallet(SOLANA_SESSION);
    await expect(WalletConnectWallet.prototype.connect.call(wallet)).resolves.toEqual({ publicKey });
    expect(initModal).not.toHaveBeenCalled();
    expect(provider.connect).not.toHaveBeenCalled();
  });

  it("restores a session that appears after UniversalProvider init", async () => {
    vi.useFakeTimers();
    try {
      setSilentWalletConnectConnect(true);
      const { wallet, initModal, provider, publicKey } = createWallet();
      const pending = WalletConnectWallet.prototype.connect.call(wallet);
      provider.session = SOLANA_SESSION;
      await vi.advanceTimersByTimeAsync(SOLANA_WC_SESSION_POLL_MS);
      await expect(pending).resolves.toEqual({ publicKey });
      expect(initModal).not.toHaveBeenCalled();
      expect(provider.connect).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("fails without opening the WalletConnect modal when no session exists", async () => {
    vi.useFakeTimers();
    try {
      setSilentWalletConnectConnect(true);
      const { wallet, initModal, provider } = createWallet();
      const pending = WalletConnectWallet.prototype.connect.call(wallet);
      pending.catch(() => undefined);
      await vi.advanceTimersByTimeAsync(SOLANA_WC_SILENT_SESSION_TIMEOUT_MS);
      await expect(pending).rejects.toBeInstanceOf(WalletConnectSilentConnectError);
      expect(initModal).not.toHaveBeenCalled();
      expect(provider.connect).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("hasExistingSolanaWalletConnectSession", () => {
  it("returns false when projectId is missing", async () => {
    await expect(hasExistingSolanaWalletConnectSession({ projectId: "" })).resolves.toBe(false);
  });

  it("finds an existing Solana session without opening the WalletConnect modal", async () => {
    const { wallet, initModal, provider } = createWallet(SOLANA_SESSION);
    await expect(peekExistingSolanaWalletConnectSession(wallet)).resolves.toBe(true);
    expect(initModal).not.toHaveBeenCalled();
    expect(provider.connect).not.toHaveBeenCalled();
  });

  it("returns false when no session exists without opening the WalletConnect modal", async () => {
    vi.useFakeTimers();
    try {
      const { wallet, initModal, provider } = createWallet();
      const pending = peekExistingSolanaWalletConnectSession(wallet);
      pending.catch(() => undefined);
      await vi.advanceTimersByTimeAsync(SOLANA_WC_SILENT_SESSION_TIMEOUT_MS);
      await expect(pending).resolves.toBe(false);
      expect(initModal).not.toHaveBeenCalled();
      expect(provider.connect).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
