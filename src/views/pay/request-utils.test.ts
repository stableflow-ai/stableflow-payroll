import { describe, expect, it } from "vitest";
import {
  applyRequestPayoutFields,
  buildPaymentRequestUrl,
  defaultAddressForNetwork,
  formatCouponAmount,
  parsePaymentRequestId,
  truncateMiddle,
  receivedPaymentStatusLabel,
  receivingAddressError,
  requestStatusExplorerUrl,
  toReceivedPaymentView,
} from "./request-utils";
import { PAY_REQUEST_STATUS } from "./config";
import type { PaymentRequestItem } from "@/types/request-payment";

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
  it("builds a form payment link from batch id", () => {
    expect(buildPaymentRequestUrl("https://pay.example/", 42)).toBe(
      "https://pay.example/pay/form?batch_id=42",
    );
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
  const item: PaymentRequestItem = {
    batchId: 7,
    title: "Invoice request",
    userId: 4,
    name: "Andrew",
    email: "a@example.com",
    purpose: "Invoice-Adward-July",
    description: "invoice",
    amount: "12.5",
    symbol: "USDC",
    network: "arb",
    recipient: "0x1111111111111111111111111111111111111111",
    status: PAY_REQUEST_STATUS.Completed,
    paymentId: "pay-7",
    payerUserId: 1,
    payer: "0x2222222222222222222222222222222222222222",
    paidAt: "2026-08-21T08:51:55.754Z",
    createdAt: "2026-08-20T08:51:55.754Z",
    updatedAt: "2026-08-21T08:51:55.754Z",
    destinationTxHash: "0xcomplete",
  };

  it("maps chain display fields", () => {
    const row = toReceivedPaymentView(item);
    expect(row.network).toBe("Arbitrum");
    expect(row.blockchain).toBe("arb");
    expect(row.paymentName).toBe("Invoice-Adward-July");
    expect(row.paidAddress).toBe("0x2222222222222222222222222222222222222222");
  });

  it("labels request statuses", () => {
    expect(receivedPaymentStatusLabel(toReceivedPaymentView(item))).toBe("Complete");
    expect(receivedPaymentStatusLabel(toReceivedPaymentView({
      ...item,
      status: PAY_REQUEST_STATUS.Pending,
    }))).toBe("Pending");
    expect(receivedPaymentStatusLabel(toReceivedPaymentView({
      ...item,
      status: PAY_REQUEST_STATUS.Submitted,
    }))).toBe("Pending");
    expect(receivedPaymentStatusLabel(toReceivedPaymentView({
      ...item,
      status: PAY_REQUEST_STATUS.Created,
    }))).toBe("Pending");
    expect(receivedPaymentStatusLabel(toReceivedPaymentView({
      ...item,
      status: PAY_REQUEST_STATUS.Processing,
    }))).toBe("Pending");
    expect(receivedPaymentStatusLabel(toReceivedPaymentView({
      ...item,
      status: PAY_REQUEST_STATUS.Expired,
    }))).toBe("Failed");
  });

  it("picks explorer hashes when a receive tx hash is present", () => {
    expect(requestStatusExplorerUrl(toReceivedPaymentView(item))).toContain("0xcomplete");
    expect(requestStatusExplorerUrl(toReceivedPaymentView({
      ...item,
      status: PAY_REQUEST_STATUS.Pending,
    }))).toContain("0xcomplete");
    expect(requestStatusExplorerUrl(toReceivedPaymentView({
      ...item,
      destinationTxHash: "",
    }))).toBeNull();
  });
});

describe("defaultAddressForNetwork", () => {
  it("matches blockchain aliases and ignores blanks", () => {
    const addresses = [
      { address: "0xabc", network: "arb" },
      { address: "near.near", network: "near" },
    ];
    expect(defaultAddressForNetwork(addresses, "arbitrum")).toBe("0xabc");
    expect(defaultAddressForNetwork(addresses, "near")).toBe("near.near");
    expect(defaultAddressForNetwork(addresses, "eth")).toBeNull();
  });
});

describe("formatCouponAmount", () => {
  it("splits whole and fraction without padding", () => {
    expect(formatCouponAmount("500")).toEqual({ whole: "500", fraction: undefined });
    expect(formatCouponAmount("12.5")).toEqual({ whole: "12", fraction: "5" });
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
