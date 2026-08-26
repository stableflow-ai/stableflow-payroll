import { describe, expect, it } from "vitest";
import {
  applyRequestPayoutFields,
  buildPaymentRequestUrl,
  canWithdrawRequest,
  formatCouponAmount,
  parsePaymentRequestId,
  truncateMiddle,
  pendingWithdrawCount,
  receivedPaymentStatusLabel,
  receivingAddressError,
  requestStatusExplorerUrl,
  toReceivedPaymentView,
} from "./request-utils";
import { PAY_REQUEST_MODE, PAY_REQUEST_STATUS } from "./config";
import type { PayRequestItem } from "@/types/request-payment";

describe("receivingAddressError", () => {
  it("rejects empty and unrecognized addresses", () => {
    expect(receivingAddressError("", "evm")).toBe("Address cannot be empty");
    expect(receivingAddressError("???", "evm")).toBe("Unrecognized address");
  });

  it("rejects a token chain that does not match the address", () => {
    expect(
      receivingAddressError("0x1111111111111111111111111111111111111111", "solana"),
    ).toBe("Token network does not match address type");
  });

  it("accepts a matching EVM address", () => {
    expect(receivingAddressError("0x1111111111111111111111111111111111111111", "evm")).toBeNull();
  });
});

describe("payment request id", () => {
  it("builds and parses a positive id", () => {
    expect(buildPaymentRequestUrl("https://pay.example/", 42)).toBe("https://pay.example/p/42");
    expect(parsePaymentRequestId("42")).toBe(42);
    expect(parsePaymentRequestId(" 42 ")).toBe(42);
  });

  it("rejects missing or invalid ids", () => {
    expect(parsePaymentRequestId("")).toBeNull();
    expect(parsePaymentRequestId("0")).toBeNull();
    expect(parsePaymentRequestId("-1")).toBeNull();
    expect(parsePaymentRequestId("id=42")).toBeNull();
  });
});

describe("applyRequestPayoutFields", () => {
  it("only adds request_id", () => {
    const body = {
      amount: "10",
      destinationAddress: "0x1",
      destinationNetwork: "arb",
      destinationToken: "USDC",
      network: "eth",
      refundTo: "0x2",
      slippageTolerance: 5,
      token: "USDC",
    };
    expect(applyRequestPayoutFields(body, 9)).toEqual({ ...body, request_id: 9 });
  });
});

describe("received payment view", () => {
  const item: PayRequestItem = {
    id: 7,
    amount: "12.5",
    mode: PAY_REQUEST_MODE.Private,
    network: "arb",
    private_recipient_address: "intents.near",
    recipient_address: "0x1111111111111111111111111111111111111111",
    status: PAY_REQUEST_STATUS.Completed,
    token: "USDC",
    name: "Invoice-Adward-July",
    memo: "invoice",
    created_at: "2026-08-20T08:51:55.754Z",
    payer: "0x2222222222222222222222222222222222222222",
    paid_at: "2026-08-21T08:51:55.754Z",
    destination_tx_hash: "0xcomplete",
    withdraw_tx_hash: "0xwithdraw",
  };

  it("maps chain display fields and pending withdraw", () => {
    const row = toReceivedPaymentView(item);
    expect(row.network).toBe("Arbitrum");
    expect(row.blockchain).toBe("arb");
    expect(row.private).toBe(true);
    expect(row.paymentName).toBe("Invoice-Adward-July");
    expect(row.paidAddress).toBe("0x2222222222222222222222222222222222222222");
    expect(canWithdrawRequest(row)).toBe(true);
    expect(pendingWithdrawCount([item])).toBe(1);
    expect(pendingWithdrawCount([{ ...item, mode: PAY_REQUEST_MODE.Standard }])).toBe(0);
  });

  it("labels non-withdraw statuses", () => {
    expect(receivedPaymentStatusLabel(toReceivedPaymentView({
      ...item,
      mode: PAY_REQUEST_MODE.Standard,
    }))).toBe("Received");
    expect(receivedPaymentStatusLabel(toReceivedPaymentView({
      ...item,
      status: PAY_REQUEST_STATUS.Failed,
    }))).toBe("Failed");
  });

  it("picks explorer hashes by status", () => {
    expect(requestStatusExplorerUrl(toReceivedPaymentView({
      ...item,
      status: PAY_REQUEST_STATUS.Withdrawed,
    }))).toContain("0xwithdraw");
    expect(requestStatusExplorerUrl(toReceivedPaymentView({
      ...item,
      mode: PAY_REQUEST_MODE.Standard,
      status: PAY_REQUEST_STATUS.Completed,
    }))).toContain("0xcomplete");
    expect(requestStatusExplorerUrl(toReceivedPaymentView(item))).toBeNull();
  });
});

describe("formatCouponAmount", () => {
  it("pads two decimal places", () => {
    expect(formatCouponAmount("500")).toEqual({ whole: "500", fraction: "00" });
    expect(formatCouponAmount("12.5")).toEqual({ whole: "12", fraction: "50" });
  });
});

describe("truncateMiddle", () => {
  it("keeps short strings unchanged", () => {
    expect(truncateMiddle("Invoice", 8, 8)).toBe("Invoice");
  });

  it("ellipsis in the middle of long strings", () => {
    expect(truncateMiddle("abcdefghijklmnop", 4, 4)).toBe("abcd...mnop");
  });
});
