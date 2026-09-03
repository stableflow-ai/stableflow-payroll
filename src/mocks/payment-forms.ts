import type { PayrollCreateBatchPaymentParam } from "@/types/payout";

export const PAYMENT_FORM_CATEGORY = {
  Payroll: "payroll",
  Reimbursement: "reimbursement",
  Bonus: "bonus",
} as const;

export type PaymentFormCategory =
  (typeof PAYMENT_FORM_CATEGORY)[keyof typeof PAYMENT_FORM_CATEGORY];

export interface PaymentFormSummary {
  id: string;
  category: PaymentFormCategory;
  name: string;
  totalValued: string;
}

export interface PaymentFormDetail extends PaymentFormSummary {
  payments: PayrollCreateBatchPaymentParam[];
}

const PAYMENT_FORMS: readonly PaymentFormDetail[] = [
  {
    id: "form-september-payroll",
    category: PAYMENT_FORM_CATEGORY.Payroll,
    name: "September Payroll",
    totalValued: "35000",
    payments: [
      { amount: "5000", recipient: "0x557be3f47a45499385f60cd64e2ff455e42a3311", network: "eth", symbol: "USDC", memo: "payroll" },
      { amount: "5000", recipient: "0x541a9b0e0e1c2d3f4a5b6c7d8e9f0a1b2c3d8dc1", network: "eth", symbol: "USDC" },
      { amount: "5000", recipient: "0x253ef6020000000000000000000000000000ef02", network: "eth", symbol: "USDT" },
      { amount: "5000", recipient: "stableflow.near", network: "near", symbol: "USDT" },
      { amount: "5000", recipient: "payroll.near", network: "near", symbol: "USDC" },
      { amount: "5000", recipient: "9JXR51yBLBgfesHF8SJgKWkNnx4FxtJCxCc3AV31TBsn", network: "sol", symbol: "USDC", memo: "payroll" },
      { amount: "5000", recipient: "TJbLVQHYf61a36iC7oyxdMiNSoqTMKYAMv", network: "tron", symbol: "USDT" },
    ],
  },
  {
    id: "form-open-reimbursement",
    category: PAYMENT_FORM_CATEGORY.Reimbursement,
    name: "Open reimbursement",
    totalValued: "12000",
    payments: [
      { amount: "4000", recipient: "0x557be3f47a45499385f60cd64e2ff455e42a3311", network: "eth", symbol: "USDC", memo: "travel" },
      { amount: "4000", recipient: "stableflow.near", network: "near", symbol: "USDT", memo: "software" },
      { amount: "4000", recipient: "9JXR51yBLBgfesHF8SJgKWkNnx4FxtJCxCc3AV31TBsn", network: "sol", symbol: "USDC", memo: "equipment" },
    ],
  },
  {
    id: "form-2026-bonus-team-a",
    category: PAYMENT_FORM_CATEGORY.Bonus,
    name: "2026 Bonus Team A",
    totalValued: "10000",
    payments: [
      { amount: "6000", recipient: "0x557be3f47a45499385f60cd64e2ff455e42a3311", network: "eth", symbol: "USDC", memo: "bonus" },
      { amount: "4000", recipient: "stableflow.near", network: "near", symbol: "USDT", memo: "bonus" },
    ],
  },
  {
    id: "form-2026-bonus-team-b",
    category: PAYMENT_FORM_CATEGORY.Bonus,
    name: "2026 Bonus Team B",
    totalValued: "8000",
    payments: [
      { amount: "8000", recipient: "0x541a9b0e0e1c2d3f4a5b6c7d8e9f0a1b2c3d8dc1", network: "eth", symbol: "USDC", memo: "bonus" },
    ],
  },
];

export function listPaymentForms(): PaymentFormSummary[] {
  return PAYMENT_FORMS.map(({ payments: _payments, ...summary }) => summary);
}

export function getPaymentForm(id: string): PaymentFormDetail | null {
  const trimmed = id.trim();
  if (!trimmed) return null;
  return PAYMENT_FORMS.find((row) => row.id === trimmed) ?? null;
}
