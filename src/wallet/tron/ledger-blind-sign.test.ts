import { afterEach, describe, expect, it, vi } from "vitest";
import { TRON_LEDGER_ADAPTER_NAME } from "./config";
import {
  cancelLedgerBlindSignNotice,
  confirmLedgerBlindSignNotice,
  ensureTronLedgerBlindSigning,
  getLedgerBlindSignNoticeState,
  needsTronLedgerBlindSigning,
  tronLedgerSignFieldBytes,
} from "./ledger-blind-sign";
import { setTronSigner } from "./session";

const PARAM = "00".repeat(32);
const APPROVE_CALL_DATA = `095ea7b3${PARAM}${PARAM}`;
const BATCH_CALL_DATA = `87845f2a${PARAM.repeat(8)}`;

function fakeSigner(adapterName: string, address: string) {
  return {
    address,
    adapterName,
    signTransaction: async () => ({}) as never,
  };
}

describe("tronLedgerSignFieldBytes", () => {
  it("matches the approve contract field size from production", () => {
    expect(tronLedgerSignFieldBytes({ callData: APPROVE_CALL_DATA })).toBe(177);
    expect(needsTronLedgerBlindSigning({ callData: APPROVE_CALL_DATA })).toBe(false);
  });

  it("matches the batch contract field size from production", () => {
    expect(tronLedgerSignFieldBytes({ callData: BATCH_CALL_DATA })).toBe(371);
    expect(needsTronLedgerBlindSigning({ callData: BATCH_CALL_DATA })).toBe(true);
  });

  it("ignores a 0x prefix", () => {
    expect(tronLedgerSignFieldBytes({ callData: `0x${APPROVE_CALL_DATA}` })).toBe(177);
    expect(tronLedgerSignFieldBytes({ callData: `0x${BATCH_CALL_DATA}` })).toBe(371);
  });
});

describe("ensureTronLedgerBlindSigning", () => {
  afterEach(() => {
    cancelLedgerBlindSignNotice();
    setTronSigner(null);
  });

  it("does not open a notice for a non-Ledger signer", async () => {
    setTronSigner(fakeSigner("TronLink", "Tnonledger"));
    await expect(ensureTronLedgerBlindSigning({ callData: BATCH_CALL_DATA })).resolves.toBeUndefined();
    expect(getLedgerBlindSignNoticeState().open).toBe(false);
  });

  it("opens once per Ledger address and continues after confirm", async () => {
    setTronSigner(fakeSigner(TRON_LEDGER_ADAPTER_NAME, "Tledger1"));
    const pending = ensureTronLedgerBlindSigning({ callData: BATCH_CALL_DATA });
    await vi.waitFor(() => {
      expect(getLedgerBlindSignNoticeState().open).toBe(true);
    });
    confirmLedgerBlindSignNotice();
    await expect(pending).resolves.toBeUndefined();
    expect(getLedgerBlindSignNoticeState().open).toBe(false);

    await expect(ensureTronLedgerBlindSigning({ callData: BATCH_CALL_DATA })).resolves.toBeUndefined();
    expect(getLedgerBlindSignNoticeState().open).toBe(false);
  });

  it("rejects when the notice is cancelled", async () => {
    setTronSigner(fakeSigner(TRON_LEDGER_ADAPTER_NAME, "Tledger2"));
    const pending = ensureTronLedgerBlindSigning({ callData: BATCH_CALL_DATA });
    await vi.waitFor(() => {
      expect(getLedgerBlindSignNoticeState().open).toBe(true);
    });
    cancelLedgerBlindSignNotice();
    await expect(pending).rejects.toThrow("User rejected transaction");
  });
});
