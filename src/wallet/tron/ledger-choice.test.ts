import { afterEach, describe, expect, it, vi } from "vitest";
import { LEDGER_DEVICE_LOCKED_MESSAGE } from "./config";
import {
  cancelLedgerConnectChooser,
  getLedgerConnectDialogState,
  isLedgerConnectDialogOpen,
  ledgerChooserErrorMessage,
  LedgerConnectCancelledError,
  openLedgerConnectChooser,
  submitLedgerUsbConnect,
} from "./ledger-choice";

describe("ledgerChooserErrorMessage", () => {
  it("maps a locked Ledger to the Tron unlock copy", () => {
    expect(ledgerChooserErrorMessage("Ledger device: Locked device (0x5515)")).toBe(
      LEDGER_DEVICE_LOCKED_MESSAGE,
    );
    expect(ledgerChooserErrorMessage(new Error("USB device not found"))).toBe("USB device not found");
  });
});

describe("openLedgerConnectChooser", () => {
  afterEach(() => {
    cancelLedgerConnectChooser();
  });

  it("auto-starts USB connect and keeps the dialog open on failure", async () => {
    const connectUsb = vi.fn().mockRejectedValue(new Error("Locked device (0x5515)"));
    const outcome = openLedgerConnectChooser({ connectUsb });
    await vi.waitFor(() => {
      expect(connectUsb).toHaveBeenCalledTimes(1);
      expect(getLedgerConnectDialogState().usbError).toBe(LEDGER_DEVICE_LOCKED_MESSAGE);
    });
    expect(isLedgerConnectDialogOpen()).toBe(true);

    await submitLedgerUsbConnect();
    await vi.waitFor(() => {
      expect(connectUsb).toHaveBeenCalledTimes(2);
      expect(getLedgerConnectDialogState().usbError).toBe(LEDGER_DEVICE_LOCKED_MESSAGE);
    });
    expect(isLedgerConnectDialogOpen()).toBe(true);

    cancelLedgerConnectChooser();
    await expect(outcome).resolves.toEqual({ ok: false, cancelled: true });
  });

  it("resolves ok after a successful USB connect", async () => {
    const connectUsb = vi.fn().mockResolvedValue(undefined);
    const outcome = openLedgerConnectChooser({ connectUsb });
    await expect(outcome).resolves.toEqual({ ok: true });
    expect(isLedgerConnectDialogOpen()).toBe(false);
  });
});

describe("LedgerConnectCancelledError", () => {
  it("uses a stable name", () => {
    expect(new LedgerConnectCancelledError().name).toBe("LedgerConnectCancelledError");
  });
});
