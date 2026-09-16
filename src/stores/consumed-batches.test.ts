import { beforeEach, describe, expect, it } from "vitest";
import {
  isBatchConsumed,
  markBatchConsumed,
  unmarkBatchConsumed,
  useConsumedBatchesStore,
} from "./consumed-batches";

describe("consumed batches", () => {
  beforeEach(() => {
    useConsumedBatchesStore.setState({ items: [] });
  });

  it("marks a quote_batch_id as consumed", () => {
    markBatchConsumed("qbatch-1");
    expect(isBatchConsumed("qbatch-1")).toBe(true);
  });

  it("unmarks a quote_batch_id so the same quote can retry", () => {
    markBatchConsumed("qbatch-1");
    markBatchConsumed("qbatch-2");
    unmarkBatchConsumed("qbatch-1");
    expect(isBatchConsumed("qbatch-1")).toBe(false);
    expect(isBatchConsumed("qbatch-2")).toBe(true);
  });

  it("ignores blank ids", () => {
    markBatchConsumed("   ");
    unmarkBatchConsumed("");
    expect(useConsumedBatchesStore.getState().items).toEqual([]);
  });
});
