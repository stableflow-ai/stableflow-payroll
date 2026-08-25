import { describe, expect, it } from "vitest";
import {
  applyRequestPayoutFields,
  buildPaymentRequestUrl,
  canWithdrawRequest,
  parsePaymentRequestId,
  pendingWithdrawCount,
  receivedPaymentStatusLabel,
  receivingAddressError,
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
    expect(buildPaymentRequestUrl("https://pay.example/", 42)).toBe("https://pay.example/pay?id=42");
    expect(parsePaymentRequestId("id=42")).toBe(42);
    expect(parsePaymentRequestId("?id=42")).toBe(42);
  });

  it("rejects missing or invalid ids", () => {
    expect(parsePaymentRequestId("")).toBeNull();
    expect(parsePaymentRequestId("id=0")).toBeNull();
    expect(parsePaymentRequestId("id=-1")).toBeNull();
    expect(parsePaymentRequestId("addr=0x1&amount=1&token=USDC&network=arb&uid=1")).toBeNull();
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
    memo: "invoice",
    created_at: "2026-08-20T08:51:55.754Z",
  };

  it("maps chain display fields and pending withdraw", () => {
    const row = toReceivedPaymentView(item);
    expect(row.network).toBe("Arbitrum");
    expect(row.blockchain).toBe("arb");
    expect(row.private).toBe(true);
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
});
