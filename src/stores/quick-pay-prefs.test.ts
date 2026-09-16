import { beforeEach, describe, expect, it } from "vitest";
import { useQuickPayPrefsStore } from "./quick-pay-prefs";

describe("quick-pay-prefs", () => {
  beforeEach(() => {
    useQuickPayPrefsStore.setState({
      originAssetId: null,
      notifyRecipient: false,
    });
  });

  it("remembers the Single Payment notify switch", () => {
    expect(useQuickPayPrefsStore.getState().notifyRecipient).toBe(false);
    useQuickPayPrefsStore.getState().setNotifyRecipient(true);
    expect(useQuickPayPrefsStore.getState().notifyRecipient).toBe(true);
    useQuickPayPrefsStore.getState().setNotifyRecipient(false);
    expect(useQuickPayPrefsStore.getState().notifyRecipient).toBe(false);
  });
});
