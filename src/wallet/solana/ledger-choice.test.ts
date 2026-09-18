import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LEDGER_DEVICE_LOCKED_MESSAGE,
  LEDGER_HID_BUSY_MESSAGE,
  LEDGER_WRONG_APP_MESSAGE,
} from "./config";
import {
  cancelLedgerConnectChooser,
  getLedgerConnectDialogState,
  ledgerChooserErrorMessage,
  openLedgerConnectChooser,
  submitLedgerLiveConnect,
  submitLedgerUsbConnect,
} from "./ledger-choice";

afterEach(() => {
  cancelLedgerConnectChooser();
});

describe("ledgerChooserErrorMessage", () => {
  it("maps a locked Ledger to the unlock copy", () => {
    expect(ledgerChooserErrorMessage(new Error("Ledger device: Locked device (0x5515)"))).toBe(
      LEDGER_DEVICE_LOCKED_MESSAGE,
    );
  });

  it("maps a missing Solana app APDU to the open-app copy", () => {
    expect(ledgerChooserErrorMessage(new Error("Ledger device: UNKNOWN_APDU (0x6d02)"))).toBe(
      LEDGER_WRONG_APP_MESSAGE,
    );
    expect(ledgerChooserErrorMessage(new Error("Ledger device: UNKNOWN_APDU (0x6d00)"))).toBe(
      LEDGER_WRONG_APP_MESSAGE,
    );
  });

  it("maps an in-use HID device to the busy copy", () => {
    expect(ledgerChooserErrorMessage(new Error("The device is already open."))).toBe(
      LEDGER_HID_BUSY_MESSAGE,
    );
  });
});

describe("submitLedgerUsbConnect", () => {
  it("keeps the dialog open and stores the USB error", async () => {
    const pending = openLedgerConnectChooser({
      connectUsb: async () => {
        throw new Error("Ledger device: Locked device (0x5515)");
      },
      connectLive: async () => undefined,
    });

    await submitLedgerUsbConnect();

    expect(getLedgerConnectDialogState()).toMatchObject({
      open: true,
      usbError: LEDGER_DEVICE_LOCKED_MESSAGE,
      usbBusy: false,
    });

    cancelLedgerConnectChooser();
    await expect(pending).resolves.toEqual({ ok: false, cancelled: true });
  });

  it("closes the dialog after USB connects", async () => {
    const connectUsb = vi.fn().mockResolvedValue(undefined);
    const pending = openLedgerConnectChooser({
      connectUsb,
      connectLive: async () => undefined,
    });

    await submitLedgerUsbConnect();

    expect(connectUsb).toHaveBeenCalledOnce();
    expect(getLedgerConnectDialogState().open).toBe(false);
    await expect(pending).resolves.toEqual({ ok: true });
  });
});

describe("submitLedgerLiveConnect", () => {
  it("closes the chooser before waiting on Ledger Live", async () => {
    let liveStarted = false;
    const pending = openLedgerConnectChooser({
      connectUsb: async () => undefined,
      connectLive: async () => {
        expect(getLedgerConnectDialogState().open).toBe(false);
        liveStarted = true;
      },
    });

    await submitLedgerLiveConnect();

    expect(liveStarted).toBe(true);
    await expect(pending).resolves.toEqual({ ok: true });
  });
});
