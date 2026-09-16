import {
  LEDGER_CONNECT_USB_FAILED_MESSAGE,
  LEDGER_DEVICE_LOCKED_CODE,
  LEDGER_DEVICE_LOCKED_MESSAGE,
} from "./config";

export class LedgerConnectCancelledError extends Error {
  constructor() {
    super("Ledger connect cancelled");
    this.name = "LedgerConnectCancelledError";
  }
}

function choiceErrorText(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string") return message;
  }
  return String(error ?? "");
}

export function ledgerChooserErrorMessage(error: unknown): string {
  const text = choiceErrorText(error);
  if (new RegExp(`${LEDGER_DEVICE_LOCKED_CODE}|locked device`, "i").test(text)) {
    return LEDGER_DEVICE_LOCKED_MESSAGE;
  }
  return text || LEDGER_CONNECT_USB_FAILED_MESSAGE;
}

export type LedgerConnectOutcome =
  | { ok: true }
  | { ok: false; cancelled: true }
  | { ok: false; cancelled?: false; error: unknown };

export type LedgerConnectHandlers = {
  connectUsb: () => Promise<void>;
  connectLive: () => Promise<void>;
};

export type LedgerConnectDialogState = {
  open: boolean;
  usbError: string | null;
  usbBusy: boolean;
  liveBusy: boolean;
};

type LedgerChoiceListener = () => void;

let pending: {
  resolve: (outcome: LedgerConnectOutcome) => void;
  handlers: LedgerConnectHandlers;
} | null = null;
let usbError: string | null = null;
let usbBusy = false;
let liveBusy = false;
const listeners = new Set<LedgerChoiceListener>();

function notify() {
  listeners.forEach((listener) => listener());
}

function resetBusy() {
  usbError = null;
  usbBusy = false;
  liveBusy = false;
}

export function getLedgerConnectDialogState(): LedgerConnectDialogState {
  return {
    open: pending !== null,
    usbError,
    usbBusy,
    liveBusy,
  };
}

export function subscribeLedgerConnectDialog(listener: LedgerChoiceListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function openLedgerConnectChooser(
  handlers: LedgerConnectHandlers,
): Promise<LedgerConnectOutcome> {
  pending?.resolve({ ok: false, cancelled: true });
  resetBusy();
  return new Promise((resolve) => {
    pending = { resolve, handlers };
    notify();
  });
}

export function cancelLedgerConnectChooser() {
  const current = pending;
  pending = null;
  resetBusy();
  current?.resolve({ ok: false, cancelled: true });
  notify();
}

export async function submitLedgerUsbConnect() {
  if (!pending || usbBusy || liveBusy) return;
  usbError = null;
  usbBusy = true;
  notify();
  try {
    await pending.handlers.connectUsb();
    const current = pending;
    pending = null;
    resetBusy();
    current?.resolve({ ok: true });
    notify();
  } catch (error) {
    usbBusy = false;
    usbError = ledgerChooserErrorMessage(error);
    notify();
  }
}

export async function submitLedgerLiveConnect() {
  if (!pending || usbBusy || liveBusy) return;
  const current = pending;
  pending = null;
  resetBusy();
  notify();
  try {
    await current.handlers.connectLive();
    current.resolve({ ok: true });
  } catch (error) {
    current.resolve({ ok: false, error });
  }
}
