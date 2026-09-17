import { describe, expect, it } from "vitest";
import { MULTISIG_WATCH_STATUS } from "../../multisig/types";
import { isSafeTxStatusTerminal, safeClientTransactionUrl, snapshotFromSafeGatewayBody } from "./watch";

describe("isSafeTxStatusTerminal", () => {
  it("treats success, failure, and cancel as terminal", () => {
    expect(isSafeTxStatusTerminal("SUCCESS")).toBe(true);
    expect(isSafeTxStatusTerminal("failed")).toBe(true);
    expect(isSafeTxStatusTerminal("CANCELLED")).toBe(true);
    expect(isSafeTxStatusTerminal("AWAITING_CONFIRMATIONS")).toBe(false);
    expect(isSafeTxStatusTerminal("AWAITING_EXECUTION")).toBe(false);
    expect(isSafeTxStatusTerminal(null)).toBe(false);
  });
});

describe("safeClientTransactionUrl", () => {
  it("builds the client-gateway id from the Safe and hash", () => {
    expect(safeClientTransactionUrl(
      1,
      "0xSafe",
      "0xHash",
    )).toBe("https://safe-client.safe.global/v1/chains/1/transactions/multisig_0xSafe_0xHash");
  });
});

describe("snapshotFromSafeGatewayBody", () => {
  it("reads n/m from confirmations and confirmationsRequired", () => {
    expect(snapshotFromSafeGatewayBody({
      txStatus: "AWAITING_CONFIRMATIONS",
      detailedExecutionInfo: {
        type: "MULTISIG",
        confirmationsRequired: 3,
        confirmations: [{ signer: "0x1" }, { signer: "0x2" }],
      },
    })).toEqual({
      signed: 2,
      required: 3,
      status: MULTISIG_WATCH_STATUS.Pending,
      txHash: null,
    });
  });

  it("returns the on-chain hash on SUCCESS", () => {
    expect(snapshotFromSafeGatewayBody({
      txStatus: "SUCCESS",
      txHash: "0xabc",
      detailedExecutionInfo: {
        confirmationsRequired: 1,
        confirmationsSubmitted: 1,
      },
    })).toEqual({
      signed: 1,
      required: 1,
      status: MULTISIG_WATCH_STATUS.Success,
      txHash: "0xabc",
    });
  });

  it("maps FAILED and CANCELLED to failed", () => {
    expect(snapshotFromSafeGatewayBody({ txStatus: "FAILED" }).status).toBe(MULTISIG_WATCH_STATUS.Failed);
    expect(snapshotFromSafeGatewayBody({ txStatus: "CANCELLED" }).status).toBe(MULTISIG_WATCH_STATUS.Failed);
  });
});
