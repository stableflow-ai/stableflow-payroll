import { describe, expect, it, vi } from "vitest";
import { INSUFFICIENT_APPROVAL_AMOUNT_MESSAGE } from "@/wallet/config";
import {
  TRON_BROADCAST_EXPIRED_MESSAGE,
  TRON_BROADCAST_FAILED_PREFIX,
  TRON_CONFIRM_TIMEOUT_MESSAGE,
  TRON_TX_EXPIRATION_MS,
} from "./config";
import {
  assertTronBroadcastAccepted,
  isTronConfirmTimeout,
  waitForTronApproveReady,
  waitForTronSuccess,
  withTronExpiration,
} from "./transfer";

describe("assertTronBroadcastAccepted", () => {
  it("returns the txid when result is true", () => {
    expect(assertTronBroadcastAccepted({ result: true, txid: "abc" })).toBe("abc");
  });

  it("throws the expired message without treating txid as success", () => {
    expect(() => assertTronBroadcastAccepted({
      result: false,
      code: "TRANSACTION_EXPIRATION_ERROR",
      txid: "ghost",
    })).toThrow(TRON_BROADCAST_EXPIRED_MESSAGE);
  });

  it("throws a broadcast failure for other rejected results", () => {
    expect(() => assertTronBroadcastAccepted({
      result: false,
      code: "SIGERROR",
      message: "5369676e6174757265206572726f72",
      txid: "ghost",
    })).toThrow(`${TRON_BROADCAST_FAILED_PREFIX}SIGERROR: Signature error`);
  });
});

describe("withTronExpiration", () => {
  it("rewrites expiration and refreshes the txID", async () => {
    const now = 1_000_000;
    const newTxID = vi.fn(async (tx: unknown) => ({ ...(tx as object), txID: "fresh" }));
    const prepared = await withTronExpiration(
      { txID: "old", raw_data: { expiration: 1, ref_block_bytes: "aa" } },
      { now, newTxID },
    ) as { txID: string; raw_data: { expiration: number; ref_block_bytes: string } };

    expect(prepared.txID).toBe("fresh");
    expect(prepared.raw_data.expiration).toBe(now + TRON_TX_EXPIRATION_MS);
    expect(prepared.raw_data.ref_block_bytes).toBe("aa");
    expect(newTxID).toHaveBeenCalledTimes(1);
  });

  it("drops raw_data_hex before recomputing the txID", async () => {
    const newTxID = vi.fn(async (tx: unknown) => tx);
    await withTronExpiration(
      { txID: "old", raw_data_hex: "aabb", raw_data: { expiration: 1 } },
      { now: 0, newTxID },
    );
    expect(newTxID).toHaveBeenCalledWith({
      txID: "old",
      raw_data: { expiration: TRON_TX_EXPIRATION_MS },
    });
  });

  it("throws when newTxID fails", async () => {
    await expect(withTronExpiration(
      { raw_data: { expiration: 1 } },
      { newTxID: async () => { throw new Error("hash failed"); } },
    )).rejects.toThrow("hash failed");
  });
});

describe("waitForTronSuccess", () => {
  it("returns once receipt.result is SUCCESS", async () => {
    const sleep = vi.fn(async () => {});
    const getTransactionInfo = vi.fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ receipt: { result: "SUCCESS" } });

    await expect(waitForTronSuccess("txid", {
      getTransactionInfo,
      sleep,
      maxRetries: 5,
      retryDelayMs: 10,
    })).resolves.toBeUndefined();

    expect(getTransactionInfo).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("keeps polling when getTransactionInfo throws", async () => {
    const sleep = vi.fn(async () => {});
    const getTransactionInfo = vi.fn()
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce({ receipt: { result: "SUCCESS" } });

    await expect(waitForTronSuccess("txid", {
      getTransactionInfo,
      sleep,
      maxRetries: 5,
      retryDelayMs: 10,
    })).resolves.toBeUndefined();

    expect(getTransactionInfo).toHaveBeenCalledTimes(2);
  });

  it("throws when the receipt reports a failed result", async () => {
    const sleep = vi.fn(async () => {});
    const getTransactionInfo = vi.fn().mockResolvedValue({ receipt: { result: "REVERT" } });

    await expect(waitForTronSuccess("txid", {
      getTransactionInfo,
      sleep,
      maxRetries: 3,
      retryDelayMs: 10,
    })).rejects.toThrow("Tron transaction failed: REVERT");

    expect(getTransactionInfo).toHaveBeenCalledTimes(1);
  });

  it("times out when receipt.SUCCESS never appears", async () => {
    const sleep = vi.fn(async () => {});
    const getTransactionInfo = vi.fn().mockResolvedValue({});

    await expect(waitForTronSuccess("txid", {
      getTransactionInfo,
      sleep,
      maxRetries: 3,
      retryDelayMs: 10,
    })).rejects.toThrow(TRON_CONFIRM_TIMEOUT_MESSAGE);

    expect(getTransactionInfo).toHaveBeenCalledTimes(3);
    expect(isTronConfirmTimeout(new Error(TRON_CONFIRM_TIMEOUT_MESSAGE))).toBe(true);
  });

  it("does not treat a missing receipt as success", async () => {
    const sleep = vi.fn(async () => {});
    const getTransactionInfo = vi.fn().mockResolvedValue({ id: "txid" });

    await expect(waitForTronSuccess("txid", {
      getTransactionInfo,
      sleep,
      maxRetries: 2,
      retryDelayMs: 10,
    })).rejects.toThrow(TRON_CONFIRM_TIMEOUT_MESSAGE);
  });
});

describe("waitForTronApproveReady", () => {
  it("returns when allowance covers the required amount even if the receipt stays empty", async () => {
    const sleep = vi.fn(async () => {});
    const getTransactionInfo = vi.fn().mockResolvedValue({});
    const readAllowance = vi.fn()
      .mockResolvedValueOnce(0n)
      .mockResolvedValueOnce(104189899n);

    await expect(waitForTronApproveReady({
      txid: "txid",
      requiredAmount: 104189899n,
      readAllowance,
      getTransactionInfo,
      sleep,
      maxRetries: 5,
      retryDelayMs: 10,
    })).resolves.toBeUndefined();

    expect(readAllowance).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it("throws when the receipt reports a failed result", async () => {
    const sleep = vi.fn(async () => {});
    const getTransactionInfo = vi.fn().mockResolvedValue({ receipt: { result: "REVERT" } });
    const readAllowance = vi.fn().mockResolvedValue(0n);

    await expect(waitForTronApproveReady({
      txid: "txid",
      requiredAmount: 1n,
      readAllowance,
      getTransactionInfo,
      sleep,
      maxRetries: 3,
      retryDelayMs: 10,
    })).rejects.toThrow("Tron transaction failed: REVERT");

    expect(getTransactionInfo).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("throws insufficient approval when allowance never covers the required amount", async () => {
    const sleep = vi.fn(async () => {});
    const getTransactionInfo = vi.fn().mockResolvedValue({});
    const readAllowance = vi.fn().mockResolvedValue(0n);

    await expect(waitForTronApproveReady({
      txid: "txid",
      requiredAmount: 10n,
      readAllowance,
      getTransactionInfo,
      sleep,
      maxRetries: 3,
      retryDelayMs: 10,
    })).rejects.toThrow(INSUFFICIENT_APPROVAL_AMOUNT_MESSAGE);

    expect(readAllowance).toHaveBeenCalledTimes(3);
  });
});
