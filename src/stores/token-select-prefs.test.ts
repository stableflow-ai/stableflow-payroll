import { beforeEach, describe, expect, it } from "vitest";
import {
  MAX_RECENT_ASSETS,
  MAX_RECENT_BLOCKCHAINS,
  migrateTokenSelectPrefs,
  rememberRecentAsset,
  rememberRecentBlockchain,
  useTokenSelectPrefsStore,
} from "./token-select-prefs";

describe("token-select-prefs", () => {
  beforeEach(() => {
    useTokenSelectPrefsStore.setState({
      recentAssetIds: [],
      recentBlockchains: [],
    });
  });

  it("remembers the selected token first and prepends its chain", () => {
    useTokenSelectPrefsStore.getState().setLastToken("usdt-eth", "eth");
    expect(useTokenSelectPrefsStore.getState().recentAssetIds).toEqual(["usdt-eth"]);
    expect(useTokenSelectPrefsStore.getState().recentBlockchains).toEqual(["eth"]);
  });

  it("keeps a chain MRU without clearing tokens", () => {
    useTokenSelectPrefsStore.getState().setLastToken("usdt-eth", "eth");
    useTokenSelectPrefsStore.getState().setLastBlockchain("near");
    expect(useTokenSelectPrefsStore.getState().recentAssetIds).toEqual(["usdt-eth"]);
    expect(useTokenSelectPrefsStore.getState().recentBlockchains).toEqual(["near", "eth"]);
  });

  it("moves a repeated token to the front and caps the list", () => {
    const store = useTokenSelectPrefsStore.getState();
    store.setLastToken("a", "eth");
    store.setLastToken("b", "base");
    store.setLastToken("c", "arb");
    store.setLastToken("d", "op");
    store.setLastToken("b", "base");
    expect(useTokenSelectPrefsStore.getState().recentAssetIds).toEqual(["b", "d", "c"]);
    expect(useTokenSelectPrefsStore.getState().recentAssetIds).toHaveLength(MAX_RECENT_ASSETS);
  });

  it("moves a repeated chain to the front", () => {
    const store = useTokenSelectPrefsStore.getState();
    store.setLastBlockchain("sol");
    store.setLastBlockchain("eth");
    store.setLastBlockchain("sol");
    expect(useTokenSelectPrefsStore.getState().recentBlockchains).toEqual(["sol", "eth"]);
  });
});

describe("rememberRecentAsset", () => {
  it("drops empty ids", () => {
    expect(rememberRecentAsset(["usdt-eth"], "  ")).toEqual(["usdt-eth"]);
  });
});

describe("rememberRecentBlockchain", () => {
  it("drops empty codes", () => {
    expect(rememberRecentBlockchain(["eth"], "  ")).toEqual(["eth"]);
  });

  it("caps the list", () => {
    const codes = Array.from({ length: MAX_RECENT_BLOCKCHAINS + 2 }, (_, index) => `c${index}`);
    const recent = rememberRecentBlockchain(codes.slice(1), codes[0]);
    expect(recent).toHaveLength(MAX_RECENT_BLOCKCHAINS);
    expect(recent[0]).toBe("c0");
    expect(recent).not.toContain(`c${MAX_RECENT_BLOCKCHAINS + 1}`);
  });
});

describe("migrateTokenSelectPrefs", () => {
  it("lifts a single last token and last chain from v0", () => {
    expect(migrateTokenSelectPrefs({ lastAssetId: "usdt-eth", lastBlockchain: "sol" }, 0)).toEqual({
      recentAssetIds: ["usdt-eth"],
      recentBlockchains: ["sol"],
    });
  });

  it("lifts v1 lastAssetId into the recent token list", () => {
    expect(migrateTokenSelectPrefs({
      lastAssetId: "usdt-eth",
      recentBlockchains: ["near", "sol"],
    }, 1)).toEqual({
      recentAssetIds: ["usdt-eth"],
      recentBlockchains: ["near", "sol"],
    });
  });

  it("keeps v2 lists and caps tokens", () => {
    expect(migrateTokenSelectPrefs({
      recentAssetIds: ["a", "b", "c", "d"],
      recentBlockchains: ["near"],
    }, 2)).toEqual({
      recentAssetIds: ["a", "b", "c"],
      recentBlockchains: ["near"],
    });
  });
});
