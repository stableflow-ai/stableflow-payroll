import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  detectAddressChainKind,
  formatQuoteErrorMessage,
  parsePayoutCallbackParams,
  stampDownloadFilename,
} from "./utils";

describe("detectAddressChainKind", () => {
  it("classifies a Tron address before Near", () => {
    expect(detectAddressChainKind("TJbLVQHYf61a36iC7oyxdMiNSoqTMKYAMv")).toBe("tron");
  });

  it("classifies named Near accounts including hyphen and DAO labels", () => {
    expect(detectAddressChainKind("alice.near")).toBe("near");
    expect(detectAddressChainKind("a-b.near")).toBe("near");
    expect(detectAddressChainKind("burrow.sputnik-dao.near")).toBe("near");
  });

  it("classifies a 64-character hex implicit Near account", () => {
    expect(detectAddressChainKind("a".repeat(64))).toBe("near");
  });
});

describe("formatQuoteErrorMessage", () => {
  it("converts a 1Click minimum amount from minor units", () => {
    const error = new ApiError(
      "Amount is too low for bridge, try at least 18634672511199040",
      400,
    );
    expect(formatQuoteErrorMessage(error, 18)).toBe(
      "Amount is too low for bridge, try at least 0.01863467251119904",
    );
  });
});

describe("parsePayoutCallbackParams", () => {
  it("reads the payment id from out_order_no and lowercases the status", () => {
    const parsed = parsePayoutCallbackParams(
      "out_order_no=pr_123&session_id=cs_9&status=SUCCESS&amount=100&symbol=USDC"
      + "&network=base&recipient=0xabc&tx_hash=0xdead&destination_txHash=0xbeef"
      + "&paid_at=2026-09-02T10%3A00%3A00Z",
    );
    expect(parsed.paymentId).toBe("pr_123");
    expect(parsed.sessionId).toBe("cs_9");
    expect(parsed.status).toBe("success");
    expect(parsed.amount).toBe("100");
    expect(parsed.symbol).toBe("USDC");
    expect(parsed.network).toBe("base");
    expect(parsed.recipient).toBe("0xabc");
    expect(parsed.txHash).toBe("0xdead");
    expect(parsed.destinationTxHash).toBe("0xbeef");
    expect(parsed.paidAt).toBe("2026-09-02T10:00:00Z");
  });

  it("returns empty strings when the checkout sent nothing", () => {
    const parsed = parsePayoutCallbackParams("");
    expect(parsed.paymentId).toBe("");
    expect(parsed.status).toBe("");
  });

  it("accepts a URLSearchParams instance", () => {
    const parsed = parsePayoutCallbackParams(new URLSearchParams({ out_order_no: " pr_7 " }));
    expect(parsed.paymentId).toBe("pr_7");
  });
});

describe("stampDownloadFilename", () => {
  const now = new Date(2026, 7, 25, 14, 25, 9);

  it("inserts a timestamp before the extension", () => {
    expect(stampDownloadFilename("transaction-history.csv", now)).toBe(
      "transaction-history-20260825-142509.csv",
    );
  });

  it("appends a timestamp when there is no extension", () => {
    expect(stampDownloadFilename("export", now)).toBe("export-20260825-142509");
  });
});
