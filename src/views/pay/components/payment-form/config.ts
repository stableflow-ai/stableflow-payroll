import type { ComponentType } from "react";
import { IconBonus, IconPayroll, IconReimbursement } from "@/components/icons";
import type { IconProps } from "@/components/icons/types";
import { PAYABLE_TYPE, type PayableType } from "@/types/payable";

export const PAYMENT_FORM_CATEGORY = PAYABLE_TYPE;

export const PAYMENT_FORM_CATEGORY_UI: Record<
  PayableType,
  { label: string; className: string; Icon: ComponentType<IconProps> }
> = {
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
