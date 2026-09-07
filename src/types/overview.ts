export const EMPLOYEE_PAYMENT_TYPE = {
  Income: "income",
  Payout: "payout",
} as const;

export type EmployeePaymentType =
  (typeof EMPLOYEE_PAYMENT_TYPE)[keyof typeof EMPLOYEE_PAYMENT_TYPE];

export interface MemberOverviewStats {
  totalIncome: string;
  incomeTxCount: number;
  totalPayout: string;
  payoutTxCount: number;
}

export interface MemberOverviewPayoutPoint {
  label: string;
  income: number;
  payout: number;
  incomeTx: number;
  payoutTx: number;
}

export interface MemberOpenRequest {
  id: string;
  name: string;
  createdAt: string;
}

export interface MemberRecentPayment {
  id: string;
  type: EmployeePaymentType;
  purpose: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  network: string;
  time: string;
  status: string;
  explorerUrl: string | null;
}
