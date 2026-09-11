import type { ComponentType } from "react";
import { IconBonus, IconOperations, IconPayroll, IconReimbursement } from "@/components/icons";
import type { IconProps } from "@/components/icons/types";
import { OPERATION_CATEGORY } from "@/types/operation";
import { PAYABLE_TYPE } from "@/types/payable";

export const PAYMENT_FORM_CATEGORY = PAYABLE_TYPE;

export type PaymentFormCategoryUi = {
  label: string;
  className: string;
  Icon: ComponentType<IconProps>;
};

const OPERATION_TAG_CLASS =
  "border-[#8b7cf6] bg-[rgba(139,124,246,0.2)] text-[#6f5ef0]";

export const PAYMENT_FORM_CATEGORY_UI: Record<string, PaymentFormCategoryUi> = {
  [PAYABLE_TYPE.Payroll]: {
    label: "Payroll",
    className: "border-[#6284f5] bg-[rgba(98,132,245,0.2)] text-[#6284f5]",
    Icon: IconPayroll,
  },
  [PAYABLE_TYPE.Expense]: {
    label: "Expenses",
    className: "border-[#29ccb6] bg-[rgba(41,204,182,0.2)] text-[#29ccb6]",
    Icon: IconReimbursement,
  },
  [PAYABLE_TYPE.Bonus]: {
    label: "Bonus",
    className: "border-[#fbbc05] bg-[rgba(251,188,5,0.2)] text-[#fbbc05]",
    Icon: IconBonus,
  },
  [OPERATION_CATEGORY.Office]: {
    label: "Office",
    className: OPERATION_TAG_CLASS,
    Icon: IconOperations,
  },
  [OPERATION_CATEGORY.Procurement]: {
    label: "Procurement",
    className: OPERATION_TAG_CLASS,
    Icon: IconOperations,
  },
  [OPERATION_CATEGORY.Outsourcing]: {
    label: "Outsourcing",
    className: OPERATION_TAG_CLASS,
    Icon: IconOperations,
  },
  [OPERATION_CATEGORY.KolMkt]: {
    label: "KOL&MKT",
    className: OPERATION_TAG_CLASS,
    Icon: IconOperations,
  },
  [OPERATION_CATEGORY.Grants]: {
    label: "Grants",
    className: OPERATION_TAG_CLASS,
    Icon: IconOperations,
  },
  [OPERATION_CATEGORY.OtcTreasury]: {
    label: "OTC",
    className: OPERATION_TAG_CLASS,
    Icon: IconOperations,
  },
};

export const PAYMENT_FORM_CATEGORY_FALLBACK: PaymentFormCategoryUi = {
  label: "Operations",
  className: OPERATION_TAG_CLASS,
  Icon: IconOperations,
};

export const PAYMENT_FORM_DETAILS_DESKTOP_QUERY = "(min-width: 768px)";

export const PAYMENT_FORM_DETAILS_CATEGORY_MUTED_CLASS =
  "max-w-none border-black/10 bg-[#f6f6f6] text-[#606060]";

export const PAYMENT_FORM_DETAILS_SUMMARY = {
  totalValue: "Total Value",
  recipients: "Recipients",
  nextPayDate: "Next Pay-date",
} as const;

export const PAYMENT_FORM_DETAILS_COLUMNS = [
  { key: "recipients", label: "Recipients" },
  { key: "address", label: "Address" },
  { key: "payoutPreference", label: "Payout Preference" },
  { key: "amount", label: "Amount" },
  { key: "netPay", label: "Net Pay" },
] as const;

export const BATCH_PAYMENT_MAX_ITEMS = 50;

export const BATCH_PAYMENT_ROW_PREFIX = "Batch Payment";

const BATCH_COUNT_WORDS: Record<number, string> = {
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
};

export function batchSplitBannerText(batchCount: number): string {
  const count = BATCH_COUNT_WORDS[batchCount] ?? String(batchCount);
  return `A batch payment can support up to ${BATCH_PAYMENT_MAX_ITEMS} transactions, and this payment will be divided into ${count} payments`;
}

export function batchPaymentRowLabel(index: number): string {
  return `${BATCH_PAYMENT_ROW_PREFIX} ${index}`;
}

export function batchPayoutCommitTitle(
  formTitle: string,
  batchIndex: number,
  batchCount: number,
): string {
  const title = formTitle.trim() || "Payment";
  if (batchCount <= 1) return title;
  return `${title}_Batch Payment ${batchIndex}`;
}
