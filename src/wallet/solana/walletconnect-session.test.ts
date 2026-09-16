import { describe, expect, it, vi } from "vitest";
import { QRCodeModalError, waitForWalletConnectSession } from "./walletconnect-session";

const SOLANA_SESSION = {
  namespaces: {
    solana: {
      accounts: ["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:Demo111111111111111111111111111111111111111"],
    },
  },
};

function createModalGate() {
  const listeners = new Set<(open: boolean) => void>();
  return {
    listeners,
    subscribeModalState: (callback: (open: boolean) => void) => {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    emit: (open: boolean) => {
      listeners.forEach((listener) => listener(open));
    },
  };
}

describe("waitForWalletConnectSession", () => {
  it("resolves when the modal closes after a Solana session exists", async () => {
    const modal = createModalGate();
    let session: typeof SOLANA_SESSION | undefined;
    const closeModal = vi.fn();
    const pending = waitForWalletConnectSession({
      connectProvider: () => new Promise(() => {}),
      getSession: () => session,
      subscribeModalState: modal.subscribeModalState,
      openModal: () => modal.emit(true),
      closeModal,
    });

    session = SOLANA_SESSION;
    modal.emit(false);

    await expect(pending).resolves.toEqual(SOLANA_SESSION);
    expect(closeModal).toHaveBeenCalled();
  });

  it("resolves when connect hangs but getSession later has a Solana account", async () => {
    vi.useFakeTimers();
    try {
      const modal = createModalGate();
      let session: typeof SOLANA_SESSION | undefined;
      const pending = waitForWalletConnectSession({
        connectProvider: () => new Promise(() => {}),
        getSession: () => session,
        subscribeModalState: modal.subscribeModalState,
        openModal: () => modal.emit(true),
        closeModal: vi.fn(),
        pollIntervalMs: 50,
      });

      session = SOLANA_SESSION;
      await vi.advanceTimersByTimeAsync(50);
      await expect(pending).resolves.toEqual(SOLANA_SESSION);
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects with QRCodeModalError when the opened modal closes without a session", async () => {
    const modal = createModalGate();
    const pending = waitForWalletConnectSession({
      connectProvider: () => new Promise(() => {}),
      getSession: () => undefined,
      subscribeModalState: modal.subscribeModalState,
      openModal: () => modal.emit(true),
      closeModal: vi.fn(),
    });

    modal.emit(false);

    await expect(pending).rejects.toBeInstanceOf(QRCodeModalError);
  });

  it("does not cancel when subscribeState first reports the modal closed", async () => {
    const modal = createModalGate();
    let session: typeof SOLANA_SESSION | undefined;
    const pending = waitForWalletConnectSession({
      connectProvider: () => new Promise(() => {}),
      getSession: () => session,
      subscribeModalState: (callback) => {
        callback(false);
        return modal.subscribeModalState(callback);
      },
      openModal: () => modal.emit(true),
      closeModal: vi.fn(),
    });

    session = SOLANA_SESSION;
    modal.emit(false);

    await expect(pending).resolves.toEqual(SOLANA_SESSION);
  });

  it("forwards display_uri while waiting for a session", async () => {
    const modal = createModalGate();
    const onDisplayUri = vi.fn();
    let emitUri: ((uri: string) => void) | undefined;
    let session: typeof SOLANA_SESSION | undefined;
    const pending = waitForWalletConnectSession({
      connectProvider: () => new Promise(() => {}),
      getSession: () => session,
      subscribeModalState: modal.subscribeModalState,
      openModal: () => modal.emit(true),
      closeModal: vi.fn(),
      subscribeDisplayUri: (callback) => {
        emitUri = callback;
        return () => {
          emitUri = undefined;
        };
      },
      onDisplayUri,
    });

    emitUri?.("wc:topic@2");
    session = SOLANA_SESSION;
    modal.emit(false);
    await expect(pending).resolves.toEqual(SOLANA_SESSION);
    expect(onDisplayUri).toHaveBeenCalledWith("wc:topic@2");
  });
});
