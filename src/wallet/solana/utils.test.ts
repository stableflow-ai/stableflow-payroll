import { WalletConnectionError, WalletPublicKeyError } from "@solana/wallet-adapter-base";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WALLET_CONNECTION_REJECTED_MESSAGE } from "../config";
import { LEDGER_DEVICE_LOCKED_MESSAGE, LEDGER_LIVE_WC_DEEPLINK_PREFIX } from "./config";
import { LedgerConnectCancelledError } from "./ledger-choice";
import {
  isLedgerDeviceLocked,
  openLedgerLiveWalletConnect,
  reportSolanaWalletError,
  solanaWalletErrorMessage,
} from "./utils";

describe("isLedgerDeviceLocked", () => {
  it("matches the Ledger locked-device status word", () => {
    expect(isLedgerDeviceLocked(new WalletPublicKeyError("Ledger device: Locked device (0x5515)"))).toBe(true);
    expect(isLedgerDeviceLocked(new Error("Condition of use not satisfied (0x6985)"))).toBe(false);
  });
});

describe("solanaWalletErrorMessage", () => {
  it("returns the unlock copy for a locked Ledger", () => {
    expect(solanaWalletErrorMessage("Ledger device: Locked device (0x5515)")).toBe(LEDGER_DEVICE_LOCKED_MESSAGE);
    expect(solanaWalletErrorMessage(new Error("insufficient funds"))).toBeNull();
  });
});

describe("reportSolanaWalletError", () => {
  it("toasts the unlock copy and skips a cancelled chooser", () => {
    const toast = { fail: vi.fn() };
    reportSolanaWalletError(toast, new WalletPublicKeyError("Ledger device: Locked device (0x5515)"));
    expect(toast.fail).toHaveBeenCalledWith({ title: LEDGER_DEVICE_LOCKED_MESSAGE });

    toast.fail.mockClear();
    reportSolanaWalletError(toast, new LedgerConnectCancelledError());
    expect(toast.fail).not.toHaveBeenCalled();
  });

  it("toasts a rejected connect and other wallet errors", () => {
    const toast = { fail: vi.fn() };
    reportSolanaWalletError(toast, new Error("User rejected the request"));
    expect(toast.fail).toHaveBeenCalledWith({ title: WALLET_CONNECTION_REJECTED_MESSAGE });

    toast.fail.mockClear();
    reportSolanaWalletError(toast, new WalletConnectionError("failed to open device"));
    expect(toast.fail).toHaveBeenCalledWith({ title: "failed to open device" });
  });
});

describe("openLedgerLiveWalletConnect", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the Ledger Live WalletConnect deeplink", () => {
    const location = { href: "https://payroll.stableflow.ai/" };
    vi.stubGlobal("window", { location });
    const uri = "wc:topic@2?relay-protocol=irn&symKey=abc";
    openLedgerLiveWalletConnect(uri);
    expect(location.href).toBe(`${LEDGER_LIVE_WC_DEEPLINK_PREFIX}${encodeURIComponent(uri)}`);
  });
});
