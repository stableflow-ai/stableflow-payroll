import { beforeEach, describe, expect, it } from "vitest";
import {
  useBatchPayoutCommitQueueStore,
  type BatchPayoutCommitItem,
} from "./batch-payout-commit-queue";

function item(partial: Partial<BatchPayoutCommitItem>): BatchPayoutCommitItem {
  return {
    id: "id-1",
    quoteId: "quote-1",
    quoteBatchId: "qbatch-1",
    txHash: "0x1",
    title: "September Payroll_Batch Payment 1",
    type: "payroll",
    formKey: "payroll:2026-09",
    createdAt: 1,
    ...partial,
  };
}

describe("batch payout commit queue", () => {
  beforeEach(() => {
    useBatchPayoutCommitQueueStore.setState({ queue: [] });
  });

  it("keeps two batches that share a quote_id", () => {
    const { enqueue } = useBatchPayoutCommitQueueStore.getState();
    enqueue(item({ id: "a", quoteBatchId: "qbatch-1", txHash: "0x1" }));
    enqueue(item({ id: "b", quoteBatchId: "qbatch-2", txHash: "0x2" }));
    expect(useBatchPayoutCommitQueueStore.getState().queue.map((row) => row.quoteBatchId)).toEqual([
      "qbatch-1",
      "qbatch-2",
    ]);
  });

  it("drops a second enqueue of the same quote_batch_id", () => {
    const { enqueue } = useBatchPayoutCommitQueueStore.getState();
    enqueue(item({ id: "a", quoteBatchId: "qbatch-1", txHash: "0x1" }));
    enqueue(item({ id: "b", quoteBatchId: "qbatch-1", txHash: "0x2" }));
    expect(useBatchPayoutCommitQueueStore.getState().queue).toHaveLength(1);
  });
});
