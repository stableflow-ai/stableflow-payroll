import { describe, expect, it } from "vitest";
import {
  MULTISIG_WATCH_STATUS,
  txHashForSubmit,
  watchMultisigProposal,
} from "./index";

describe("txHashForSubmit", () => {
  it("sends an empty string when the watcher has no on-chain hash", () => {
    expect(txHashForSubmit(null)).toBe("");
    expect(txHashForSubmit(undefined)).toBe("");
    expect(txHashForSubmit(" 0xabc ")).toBe("0xabc");
  });
});

describe("watchMultisigProposal", () => {
  it("treats SquadsX as success with no n/m and no hash", async () => {
    const updates: unknown[] = [];
    const snap = await watchMultisigProposal(
      {
        kind: "pending-multisig",
        chainKind: "solana",
        vaultAddress: "Vault111111111111111111111111111111111111111",
      },
      (next) => {
        updates.push(next);
      },
      new AbortController().signal,
    );
    expect(updates).toEqual([]);
    expect(snap).toEqual({
      signed: null,
      required: null,
      status: MULTISIG_WATCH_STATUS.Success,
      txHash: null,
    });
    expect(txHashForSubmit(snap.txHash)).toBe("");
  });
});
