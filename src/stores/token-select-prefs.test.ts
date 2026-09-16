import { beforeEach, describe, expect, it } from "vitest";
import { useTokenSelectPrefsStore } from "./token-select-prefs";

describe("token-select-prefs", () => {
  beforeEach(() => {
    useTokenSelectPrefsStore.setState({
      lastAssetId: null,
      lastBlockchain: null,
    });
  });

  it("remembers the last selected token and chain", () => {
    useTokenSelectPrefsStore.getState().setLastToken("usdt-eth", "eth");
    expect(useTokenSelectPrefsStore.getState().lastAssetId).toBe("usdt-eth");
    expect(useTokenSelectPrefsStore.getState().lastBlockchain).toBe("eth");
  });

  it("updates the last chain without clearing the token", () => {
    useTokenSelectPrefsStore.getState().setLastToken("usdt-eth", "eth");
    useTokenSelectPrefsStore.getState().setLastBlockchain("near");
    expect(useTokenSelectPrefsStore.getState().lastAssetId).toBe("usdt-eth");
    expect(useTokenSelectPrefsStore.getState().lastBlockchain).toBe("near");
  });
});
