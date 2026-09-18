import { describe, expect, it, vi } from "vitest";
import { TRON_CONFIRM_TIMEOUT_MESSAGE } from "./config";
import { isTronConfirmTimeout, waitForTronSuccess } from "./transfer";

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
