import { describe, expect, it, vi } from "vitest";
import { WALLET_CONNECTION_REJECTED_MESSAGE } from "../config";
import { LEDGER_DEVICE_LOCKED_MESSAGE } from "./config";
import { LedgerConnectCancelledError } from "./ledger-choice";
import { isTronSignOrSendError, reportTronWalletError } from "./utils";

describe("isTronSignOrSendError", () => {
  it("matches Tron adapter sign errors by name", () => {
    const error = new Error("Condition of use not satisfied (0x6985)");
    error.name = "WalletSignTransactionError";
    expect(isTronSignOrSendError(error)).toBe(true);
    expect(isTronSignOrSendError(new Error("Locked device (0x5515)"))).toBe(false);
  });
});

describe("reportTronWalletError", () => {
  it("deselects a cancelled Ledger chooser without toasting", () => {
    const toast = { fail: vi.fn() };
    const deselect = vi.fn();
    reportTronWalletError(toast, new LedgerConnectCancelledError(), deselect);
    expect(toast.fail).not.toHaveBeenCalled();
    expect(deselect).toHaveBeenCalledTimes(1);
  });

  it("leaves sign rejections to the payment toast", () => {
    const toast = { fail: vi.fn() };
    const deselect = vi.fn();
    const error = new Error("Condition of use not satisfied (0x6985)");
    error.name = "WalletSignTransactionError";
    reportTronWalletError(toast, error, deselect);
    expect(toast.fail).not.toHaveBeenCalled();
    expect(deselect).not.toHaveBeenCalled();
  });

  it("toasts a rejected connect and deselects", () => {
    const toast = { fail: vi.fn() };
    const deselect = vi.fn();
    reportTronWalletError(toast, new Error("User rejected the request"), deselect);
    expect(toast.fail).toHaveBeenCalledWith({ title: WALLET_CONNECTION_REJECTED_MESSAGE });
    expect(deselect).toHaveBeenCalledTimes(1);
  });

  it("does not toast a locked-device string as a connect rejection", () => {
    const toast = { fail: vi.fn() };
    const deselect = vi.fn();
    reportTronWalletError(toast, new Error(LEDGER_DEVICE_LOCKED_MESSAGE), deselect);
    expect(toast.fail).not.toHaveBeenCalled();
    expect(deselect).not.toHaveBeenCalled();
  });
});
