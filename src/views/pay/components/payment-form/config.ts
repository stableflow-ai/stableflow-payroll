import type { ComponentType } from "react";
import { IconBonus, IconPayroll, IconReimbursement } from "@/components/icons";
import type { IconProps } from "@/components/icons/types";
import {
  PAYMENT_FORM_CATEGORY,
  type PaymentFormCategory,
} from "@/hooks/use-payment-forms-api";

export const PAYMENT_FORM_CATEGORY_UI: Record<
  PaymentFormCategory,
  { label: string; className: string; Icon: ComponentType<IconProps> }
> = {
  [PAYMENT_FORM_CATEGORY.Payroll]: {
    label: "Payroll",
    className: "border-[#6284f5] bg-[rgba(98,132,245,0.2)] text-[#6284f5]",
    Icon: IconPayroll,
  },
  [PAYMENT_FORM_CATEGORY.Reimbursement]: {
    label: "Reimbursement",
    className: "border-[#29ccb6] bg-[rgba(41,204,182,0.2)] text-[#29ccb6]",
    Icon: IconReimbursement,
  },
  [PAYMENT_FORM_CATEGORY.Bonus]: {
    label: "Bonus",
    className: "border-[#fbbc05] bg-[rgba(251,188,5,0.2)] text-[#fbbc05]",
    Icon: IconBonus,
  },
};
