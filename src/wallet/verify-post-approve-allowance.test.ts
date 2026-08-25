import { describe, expect, it, vi } from "vitest";
import {
  POST_APPROVE_ALLOWANCE_MAX_RETRIES,
  POST_APPROVE_ALLOWANCE_RETRY_DELAY_MS,
} from "./config";
import { verifyPostApproveAllowance } from "./verify-post-approve-allowance";

const REQUIRED = 1_000n;

describe("verifyPostApproveAllowance", () => {
  it("returns once the on-chain allowance covers the required amount", async () => {
    const sleep = vi.fn(async () => {});
    const readAllowance = vi.fn()
      .mockResolvedValueOnce(0n)
      .mockResolvedValueOnce(REQUIRED);

    await expect(verifyPostApproveAllowance({
      requiredAmount: REQUIRED,
      readAllowance,
      sleep,
    })).resolves.toBe(REQUIRED);

    expect(readAllowance).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledWith(POST_APPROVE_ALLOWANCE_RETRY_DELAY_MS);
  });

  it("throws and skips calldata when allowance stays below the required amount", async () => {
    const sleep = vi.fn(async () => {});
    const readAllowance = vi.fn().mockResolvedValue(1n);
    const sendCallData = vi.fn();

    await expect((async () => {
      await verifyPostApproveAllowance({
        requiredAmount: REQUIRED,
        readAllowance,
        sleep,
      });
      sendCallData();
    })()).rejects.toThrow("Insufficient approval amount");

    expect(readAllowance).toHaveBeenCalledTimes(POST_APPROVE_ALLOWANCE_MAX_RETRIES);
    expect(sleep).toHaveBeenCalledTimes(POST_APPROVE_ALLOWANCE_MAX_RETRIES - 1);
    expect(sendCallData).not.toHaveBeenCalled();
  });

  it("retries RPC read failures then succeeds", async () => {
    const sleep = vi.fn(async () => {});
    const readAllowance = vi.fn()
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce(REQUIRED);

    await expect(verifyPostApproveAllowance({
      requiredAmount: REQUIRED,
      readAllowance,
      sleep,
    })).resolves.toBe(REQUIRED);

    expect(readAllowance).toHaveBeenCalledTimes(2);
  });

  it("wraps a persistent RPC failure after the last retry", async () => {
    const sleep = vi.fn(async () => {});
    const readAllowance = vi.fn().mockRejectedValue(new Error("network error"));

    await expect(verifyPostApproveAllowance({
      requiredAmount: REQUIRED,
      readAllowance,
      sleep,
    })).rejects.toThrow("Failed to verify approval allowance: network error");

    expect(readAllowance).toHaveBeenCalledTimes(POST_APPROVE_ALLOWANCE_MAX_RETRIES);
  });
});
