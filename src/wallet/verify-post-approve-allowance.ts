import {
  INSUFFICIENT_APPROVAL_AMOUNT_MESSAGE,
  POST_APPROVE_ALLOWANCE_MAX_RETRIES,
  POST_APPROVE_ALLOWANCE_RETRY_DELAY_MS,
  VERIFY_APPROVAL_ALLOWANCE_FAILED_MESSAGE,
} from "./config";

function defaultSleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "";
}

export async function verifyPostApproveAllowance(params: {
  requiredAmount: bigint;
  readAllowance: () => Promise<bigint>;
  sleep?: (ms: number) => Promise<void>;
  maxRetries?: number;
  retryDelayMs?: number;
}): Promise<bigint> {
  const maxRetries = params.maxRetries ?? POST_APPROVE_ALLOWANCE_MAX_RETRIES;
  const retryDelayMs = params.retryDelayMs ?? POST_APPROVE_ALLOWANCE_RETRY_DELAY_MS;
  const sleep = params.sleep ?? defaultSleep;

  for (let retryIndex = 0; retryIndex < maxRetries; retryIndex++) {
    try {
      const allowance = await params.readAllowance();
      if (allowance >= params.requiredAmount) return allowance;
      if (retryIndex === maxRetries - 1) {
        throw new Error(INSUFFICIENT_APPROVAL_AMOUNT_MESSAGE);
      }
    } catch (error: unknown) {
      if (errorMessage(error) === INSUFFICIENT_APPROVAL_AMOUNT_MESSAGE) throw error;
      if (retryIndex === maxRetries - 1) {
        const message = errorMessage(error);
        throw new Error(
          message
            ? `${VERIFY_APPROVAL_ALLOWANCE_FAILED_MESSAGE}: ${message}`
            : VERIFY_APPROVAL_ALLOWANCE_FAILED_MESSAGE,
        );
      }
    }
    await sleep(retryDelayMs);
  }

  throw new Error(`${VERIFY_APPROVAL_ALLOWANCE_FAILED_MESSAGE}. You can click Confirm to retry.`);
}
