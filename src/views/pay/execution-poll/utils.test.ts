import { describe, expect, it } from "vitest";
import type { PayrollExecutionItem } from "@/types/payout";
import { HISTORY_PATH } from "@/views/pay/config";
import { PAYROLL_HISTORY_PATH } from "@/views/payroll/config";
import { EXPENSE_HISTORY_PATH } from "@/views/expense/config";
import { BONUS_HISTORY_PATH } from "@/views/bonus/config";
import {
  executionHistoryPath,
  executionItemToastKind,
  executionItemToastText,
  executionItemToastTitle,
  newTerminalExecutionItems,
} from "./utils";

function item(
  partial: Partial<PayrollExecutionItem> & Pick<PayrollExecutionItem, "id" | "status">,
): PayrollExecutionItem {
  return {
    executionId: 1,
    sourceItemId: partial.id,
    name: "",
    purpose: "",
    description: "",
    amount: "",
    payer: "",
    sourceAmount: "",
    sourceVolume: "",
    sourceSymbol: "",
    sourceNetwork: "",
    txHash: "",
    recipient: "",
    destinationAssetId: "",
    destinationAmount: "",
    destinationVolume: "",
    destinationSymbol: "",
    destinationNetwork: "",
    destinationTxHash: "",
    submittedAt: "",
    paidAt: "",
    createdAt: "",
    updatedAt: "",
    ...partial,
  };
}

describe("executionHistoryPath", () => {
  it("maps payroll aliases, expense, bonus, and unknown", () => {
    expect(executionHistoryPath("payroll")).toBe(PAYROLL_HISTORY_PATH);
    expect(executionHistoryPath("salary")).toBe(PAYROLL_HISTORY_PATH);
    expect(executionHistoryPath("expense")).toBe(EXPENSE_HISTORY_PATH);
    expect(executionHistoryPath("bonus")).toBe(BONUS_HISTORY_PATH);
    expect(executionHistoryPath("other")).toBe(HISTORY_PATH);
  });
});

describe("newTerminalExecutionItems", () => {
  it("returns unseen completed, failed, and expired items", () => {
    const list = [
      item({ id: 1, status: "completed", name: "A" }),
      item({ id: 2, status: "failed", name: "B" }),
      item({ id: 3, status: "expired", name: "C" }),
      item({ id: 4, status: "processing", name: "D" }),
      item({ id: 1, status: "completed", name: "A again" }),
    ];
    const next = newTerminalExecutionItems(new Set([1]), list);
    expect(next.map((row) => row.id)).toEqual([2, 3]);
  });
});

describe("execution item toast copy", () => {
  it("builds the paying-to title and terminal text", () => {
    expect(
      executionItemToastTitle({
        name: "Andrew",
        recipient: "0x541a1b2c3d4e5f678901234567890abcdef58dc1",
      }),
    ).toBe("Paying to Andrew 0x541...8dc1");
    expect(executionItemToastText("completed")).toBe("Transaction success!");
    expect(executionItemToastText("failed")).toBe("Transaction failed");
    expect(executionItemToastText("expired")).toBe("Transaction expired");
    expect(executionItemToastKind("completed")).toBe("success");
    expect(executionItemToastKind("failed")).toBe("fail");
    expect(executionItemToastKind("expired")).toBe("fail");
    expect(executionItemToastKind("processing")).toBeNull();
  });
});
