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

export interface PaymentFormRecipient {
  name: string;
  email: string;
  address: string;
  network: string;
  symbol: string;
  amount: string;
  netPay: string;
  adjustment?: string;
  memo?: string;
}

export interface PaymentFormDetail extends PaymentFormSummary {
  nextPayDate?: string;
  recipients: PaymentFormRecipient[];
  payments: PayrollCreateBatchPaymentParam[];
}

function paymentsFromRecipients(
  recipients: readonly PaymentFormRecipient[],
): PayrollCreateBatchPaymentParam[] {
  return recipients.map((row) => ({
    amount: row.amount,
    recipient: row.address,
    network: row.network,
    symbol: row.symbol,
    ...(row.memo ? { memo: row.memo } : {}),
  }));
}

function paymentForm(
  summary: PaymentFormSummary & { nextPayDate?: string },
  recipients: readonly PaymentFormRecipient[],
): PaymentFormDetail {
  return {
    ...summary,
    recipients: [...recipients],
    payments: paymentsFromRecipients(recipients),
  };
}

const ADDR = {
  evmA: "0x557be3f47a45499385f60cd64e2ff455e42a3311",
  evmB: "0x541a9b0e0e1c2d3f4a5b6c7d8e9f0a1b2c3d8dc1",
  evmC: "0x253ef6020000000000000000000000000000ef02",
  nearA: "stableflow.near",
  nearB: "payroll.near",
  sol: "9JXR51yBLBgfesHF8SJgKWkNnx4FxtJCxCc3AV31TBsn",
  tron: "TJbLVQHYf61a36iC7oyxdMiNSoqTMKYAMv",
} as const;

const PAYMENT_FORMS: readonly PaymentFormDetail[] = [
  paymentForm(
    {
      id: "form-september-payroll",
      category: PAYMENT_FORM_CATEGORY.Payroll,
      name: "September Payroll",
      totalValued: "35000",
      nextPayDate: "2026-09-01",
    },
    [
      { name: "Andrew", email: "andrew@gmail.com", address: ADDR.evmA, network: "eth", symbol: "USDC", amount: "5000", netPay: "5500", adjustment: "+500", memo: "payroll" },
      { name: "Hannah Petty", email: "hannah@gmail.com", address: ADDR.evmB, network: "eth", symbol: "USDC", amount: "3000", netPay: "3000" },
      { name: "Albert", email: "albert@gmail.com", address: ADDR.evmC, network: "eth", symbol: "USDT", amount: "4000", netPay: "3500", adjustment: "-500" },
      { name: "Zoey", email: "zoey@gmail.com", address: ADDR.nearA, network: "near", symbol: "USDT", amount: "8000", netPay: "8000" },
      { name: "Andrew", email: "andrew@gmail.com", address: ADDR.nearB, network: "near", symbol: "USDC", amount: "5000", netPay: "5000" },
      { name: "Hannah Petty", email: "hannah@gmail.com", address: ADDR.sol, network: "sol", symbol: "USDC", amount: "3000", netPay: "3000", memo: "payroll" },
      { name: "Albert", email: "albert@gmail.com", address: ADDR.tron, network: "tron", symbol: "USDT", amount: "2000", netPay: "2000" },
      { name: "Zoey", email: "zoey@gmail.com", address: ADDR.evmA, network: "eth", symbol: "USDC", amount: "2000", netPay: "2000" },
      { name: "Andrew", email: "andrew@gmail.com", address: ADDR.evmB, network: "eth", symbol: "USDC", amount: "1500", netPay: "1500" },
      { name: "Hannah Petty", email: "hannah@gmail.com", address: ADDR.nearA, network: "near", symbol: "USDC", amount: "1000", netPay: "1000" },
      { name: "Albert", email: "albert@gmail.com", address: ADDR.sol, network: "sol", symbol: "USDC", amount: "300", netPay: "300" },
      { name: "Zoey", email: "zoey@gmail.com", address: ADDR.tron, network: "tron", symbol: "USDT", amount: "200", netPay: "200" },
    ],
  ),
  paymentForm(
    {
      id: "form-open-reimbursement",
      category: PAYMENT_FORM_CATEGORY.Reimbursement,
      name: "Open reimbursement",
      totalValued: "12000",
    },
    [
      { name: "Andrew", email: "andrew@gmail.com", address: ADDR.evmA, network: "eth", symbol: "USDC", amount: "4000", netPay: "4000", memo: "travel" },
      { name: "Hannah Petty", email: "hannah@gmail.com", address: ADDR.nearA, network: "near", symbol: "USDT", amount: "4000", netPay: "4000", memo: "software" },
      { name: "Zoey", email: "zoey@gmail.com", address: ADDR.sol, network: "sol", symbol: "USDC", amount: "4000", netPay: "4000", memo: "equipment" },
    ],
  ),
  paymentForm(
    {
      id: "form-2026-bonus-team-a",
      category: PAYMENT_FORM_CATEGORY.Bonus,
      name: "2026 Bonus Team A",
      totalValued: "10000",
    },
    [
      { name: "Andrew", email: "andrew@gmail.com", address: ADDR.evmA, network: "eth", symbol: "USDC", amount: "6000", netPay: "6000", memo: "bonus" },
      { name: "Albert", email: "albert@gmail.com", address: ADDR.nearA, network: "near", symbol: "USDT", amount: "4000", netPay: "4000", memo: "bonus" },
    ],
  ),
  paymentForm(
    {
      id: "form-2026-bonus-team-b",
      category: PAYMENT_FORM_CATEGORY.Bonus,
      name: "2026 Bonus Team B",
      totalValued: "8000",
    },
    [
      { name: "Hannah Petty", email: "hannah@gmail.com", address: ADDR.evmB, network: "eth", symbol: "USDC", amount: "8000", netPay: "8000", memo: "bonus" },
    ],
  ),
];

export function listPaymentForms(): PaymentFormSummary[] {
  return PAYMENT_FORMS.map((row) => ({
    id: row.id,
    category: row.category,
    name: row.name,
    totalValued: row.totalValued,
  }));
}

export function getPaymentForm(id: string): PaymentFormDetail | null {
  const trimmed = id.trim();
  if (!trimmed) return null;
  return PAYMENT_FORMS.find((row) => row.id === trimmed) ?? null;
}
