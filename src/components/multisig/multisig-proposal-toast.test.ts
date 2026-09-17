import { describe, expect, it, vi } from "vitest";
import {
  listenToastText,
  showMultisigConfirmToast,
  showMultisigListenToast,
} from "./multisig-proposal-toast";

type InfoPayload = {
  onClose?: () => void;
  duration?: boolean | number;
};

function toastApi() {
  return {
    info: vi.fn((_payload: InfoPayload) => ({ id: "t", dismiss: vi.fn(), update: vi.fn() })),
  };
}

describe("showMultisigConfirmToast", () => {
  it("does not attach onClose, so dismissing it cannot abort a watcher", () => {
    const toast = toastApi();
    showMultisigConfirmToast(toast as never, {
      title: "Confirm this transaction in your Safe",
      label: "Review it in your Safe queue",
      url: "https://app.safe.global/queue",
    });
    expect(toast.info).toHaveBeenCalledTimes(1);
    const payload = toast.info.mock.calls[0][0];
    expect(payload.onClose).toBeUndefined();
    expect(payload.duration).toBe(false);
  });
});

describe("showMultisigListenToast", () => {
  it("only forwards onClose; abort stays with the host", () => {
    const toast = toastApi();
    const onClose = vi.fn();
    showMultisigListenToast(toast as never, { signed: 1, required: 2, onClose });
    const payload = toast.info.mock.calls[0][0];
    expect(payload.onClose).toBe(onClose);
    payload.onClose?.();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("listenToastText", () => {
  it("hides n/m when either count is missing", () => {
    expect(listenToastText(null, 3)).toBeUndefined();
    expect(listenToastText(1, null)).toBeUndefined();
  });
});
