import { beforeEach, describe, expect, it } from "vitest";
import {
  MAX_RECENT_BLOCKCHAINS,
  migrateTokenSelectPrefs,
  rememberRecentBlockchain,
  useTokenSelectPrefsStore,
} from "./token-select-prefs";

describe("token-select-prefs", () => {
  beforeEach(() => {
    useTokenSelectPrefsStore.setState({
      lastAssetId: null,
      recentBlockchains: [],
    });
  });

  it("remembers the last selected token and prepends its chain", () => {
    useTokenSelectPrefsStore.getState().setLastToken("usdt-eth", "eth");
    expect(useTokenSelectPrefsStore.getState().lastAssetId).toBe("usdt-eth");
    expect(useTokenSelectPrefsStore.getState().recentBlockchains).toEqual(["eth"]);
  });

  it("keeps a chain MRU without clearing the token", () => {
    useTokenSelectPrefsStore.getState().setLastToken("usdt-eth", "eth");
    useTokenSelectPrefsStore.getState().setLastBlockchain("near");
    expect(useTokenSelectPrefsStore.getState().lastAssetId).toBe("usdt-eth");
    expect(useTokenSelectPrefsStore.getState().recentBlockchains).toEqual(["near", "eth"]);
  });

  it("moves a repeated chain to the front", () => {
    const store = useTokenSelectPrefsStore.getState();
    store.setLastBlockchain("sol");
    store.setLastBlockchain("eth");
    store.setLastBlockchain("sol");
    expect(useTokenSelectPrefsStore.getState().recentBlockchains).toEqual(["sol", "eth"]);
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
  it("lifts a single lastBlockchain into the MRU list", () => {
    expect(migrateTokenSelectPrefs({ lastAssetId: "usdt-eth", lastBlockchain: "sol" }, 0)).toEqual({
      lastAssetId: "usdt-eth",
      recentBlockchains: ["sol"],
    });
  });

  it("keeps v1 recentBlockchains", () => {
    expect(migrateTokenSelectPrefs({
      lastAssetId: "usdt-eth",
      recentBlockchains: ["near", "sol"],
    }, 1)).toEqual({
      lastAssetId: "usdt-eth",
      recentBlockchains: ["near", "sol"],
    });
  });
});
