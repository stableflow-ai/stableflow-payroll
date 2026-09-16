import { describe, expect, it, vi } from "vitest";
import {
  isWalletConnectionRejected,
  reportWalletConnectError,
  withWalletConnectError,
} from "./connect-feedback";

describe("isWalletConnectionRejected", () => {
  it("matches user-rejected connect errors", () => {
    expect(isWalletConnectionRejected(new Error("User rejected the request"))).toBe(true);
    expect(isWalletConnectionRejected("User closed modal")).toBe(true);
    expect(isWalletConnectionRejected({ error: new Error("connection rejected") })).toBe(true);
  });

  it("ignores transaction, switch-chain, and unrelated errors", () => {
    expect(isWalletConnectionRejected(new Error("insufficient funds"))).toBe(false);
    expect(isWalletConnectionRejected(new Error("Requested chain is not authorized in this WalletConnect session"))).toBe(false);
    expect(isWalletConnectionRejected(new Error("An error occurred when attempting to switch chain."))).toBe(false);
  });
});

describe("reportWalletConnectError", () => {
  it("toasts a rejection and ignores unrelated errors", () => {
    const toast = { fail: vi.fn() };
    reportWalletConnectError(toast, new Error("User rejected the request"));
    expect(toast.fail).toHaveBeenCalledWith({ title: "Wallet connection rejected" });

    toast.fail.mockClear();
    reportWalletConnectError(toast, new Error("insufficient funds"));
    expect(toast.fail).not.toHaveBeenCalled();
  });
});

describe("withWalletConnectError", () => {
  it("toasts a rejection and rethrows the original error", async () => {
    const toast = { fail: vi.fn() };
    const error = new Error("User rejected the request");
    await expect(withWalletConnectError(toast, async () => {
      throw error;
    })).rejects.toBe(error);
    expect(toast.fail).toHaveBeenCalledWith({ title: "Wallet connection rejected" });
  });
});
