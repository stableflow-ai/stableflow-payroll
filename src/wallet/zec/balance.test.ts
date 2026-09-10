import { beforeEach, describe, expect, it, vi } from "vitest";
import { zcashWalletAdapter } from "./sdk";
import { readNativeZecBalance } from "./balance";

vi.mock("./sdk", () => ({
  zcashWalletAdapter: {
    getBalance: vi.fn(),
  },
}));

describe("readNativeZecBalance", () => {
  beforeEach(() => {
    vi.mocked(zcashWalletAdapter.getBalance).mockReset();
  });

  it("converts the shielded balance and ignores transparent and available", async () => {
    vi.mocked(zcashWalletAdapter.getBalance).mockResolvedValue({
      transparent: "1",
      shielded: "0.002828",
      available: "0.002428",
      accounts: [],
    });
    expect(await readNativeZecBalance()).toBe(282800n);
  });
});
