import { beforeEach, describe, expect, it, vi } from "vitest";
import { zcashWalletAdapter } from "./sdk";
import {
  assertNativeZecSpendable,
  readNativeZecBalance,
  readNativeZecFunding,
  zecSpendableGateMessage,
} from "./balance";
import { ZEC_CONFIRMING_MESSAGE, ZEC_INSUFFICIENT_BALANCE_MESSAGE } from "./config";

vi.mock("./sdk", () => ({
  zcashWalletAdapter: {
    getBalance: vi.fn(),
  },
}));

describe("readNativeZecBalance", () => {
  beforeEach(() => {
    vi.mocked(zcashWalletAdapter.getBalance).mockReset();
  });

  it("uses available spendable funds and ignores transparent", async () => {
    vi.mocked(zcashWalletAdapter.getBalance).mockResolvedValue({
      transparent: "1",
      shielded: "0.002828",
      available: "0.002428",
      accounts: [],
    });
    expect(await readNativeZecBalance()).toBe(242800n);
  });

  it("falls back to spendable then shielded", async () => {
    vi.mocked(zcashWalletAdapter.getBalance).mockResolvedValue({
      transparent: "0",
      shielded: "0.002828",
      spendable: "0.002",
      accounts: [],
    });
    expect(await readNativeZecBalance()).toBe(200000n);

    vi.mocked(zcashWalletAdapter.getBalance).mockResolvedValue({
      transparent: "0",
      shielded: "0.002828",
      accounts: [],
    });
    expect(await readNativeZecBalance()).toBe(282800n);
  });
});

describe("readNativeZecFunding", () => {
  beforeEach(() => {
    vi.mocked(zcashWalletAdapter.getBalance).mockReset();
  });

  it("returns spendable and shielded raw amounts", async () => {
    vi.mocked(zcashWalletAdapter.getBalance).mockResolvedValue({
      transparent: "0",
      shielded: "0.002828",
      available: "0.002428",
      accounts: [],
    });
    expect(await readNativeZecFunding()).toEqual({
      available: 242800n,
      shielded: 282800n,
    });
  });
});

describe("assertNativeZecSpendable", () => {
  beforeEach(() => {
    vi.mocked(zcashWalletAdapter.getBalance).mockReset();
  });

  it("passes when available covers the amount", async () => {
    vi.mocked(zcashWalletAdapter.getBalance).mockResolvedValue({
      transparent: "0",
      shielded: "0.002828",
      available: "0.002428",
      accounts: [],
    });
    await expect(assertNativeZecSpendable(242800n)).resolves.toBeUndefined();
  });

  it("throws the confirming message when shielded covers but available does not", async () => {
    vi.mocked(zcashWalletAdapter.getBalance).mockResolvedValue({
      transparent: "0",
      shielded: "0.002828",
      available: "0.002428",
      accounts: [],
    });
    await expect(assertNativeZecSpendable(282800n)).rejects.toThrow(ZEC_CONFIRMING_MESSAGE);
  });

  it("throws insufficient when shielded is also short", async () => {
    vi.mocked(zcashWalletAdapter.getBalance).mockResolvedValue({
      transparent: "0",
      shielded: "0.001",
      available: "0.001",
      accounts: [],
    });
    await expect(assertNativeZecSpendable(282800n)).rejects.toThrow(ZEC_INSUFFICIENT_BALANCE_MESSAGE);
  });
});

describe("zecSpendableGateMessage", () => {
  it("keeps confirming and insufficient copy, and maps other errors to a read failure", () => {
    expect(zecSpendableGateMessage(new Error(ZEC_CONFIRMING_MESSAGE))).toBe(ZEC_CONFIRMING_MESSAGE);
    expect(zecSpendableGateMessage(new Error(ZEC_INSUFFICIENT_BALANCE_MESSAGE))).toBe(
      ZEC_INSUFFICIENT_BALANCE_MESSAGE,
    );
    expect(zecSpendableGateMessage(new Error("rpc down"))).toBe("Could not read wallet balance");
  });
});
