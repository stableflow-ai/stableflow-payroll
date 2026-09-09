export interface PayBatchReceive {
  address: string;
  amount: string;
  network: string;
  token: string;
  memo?: string;
}

export interface PayBatchNearAction {
  type: "FunctionCall";
  params: {
    methodName: string;
    args: Record<string, unknown>;
    gas: string;
    deposit: string;
  };
}

export interface PayBatchSwapOutput {
  address: string;
  amount: string;
  amountRaw: string;
}

export interface PayBatchSwapTransaction {
  approvals: string[] | null;
  callData: string;
  batch_contract: string;
  receiverId?: string;
  actions?: PayBatchNearAction[];
  serializedTransaction?: string;
  lastValidBlockHeight?: number;
  outputs?: PayBatchSwapOutput[];
}

export interface PayBatchSubmitParam {
  quote_id: string;
  tx_hash: string;
}

export interface PayrollPayoutSubmitResult {
  executionId: number;
}

export const PAYROLL_EXECUTION_ITEM_STATUS = {
  Completed: "completed",
  Failed: "failed",
  Expired: "expired",
} as const;

export type PayrollExecutionItemStatus =
  (typeof PAYROLL_EXECUTION_ITEM_STATUS)[keyof typeof PAYROLL_EXECUTION_ITEM_STATUS];

export interface PayrollExecutionItem {
  id: number;
  executionId: number;
  sourceItemId: number;
  name: string;
  purpose: string;
  description: string;
  amount: string;
  payer: string;
  sourceAmount: string;
  sourceVolume: string;
  sourceSymbol: string;
  sourceNetwork: string;
  txHash: string;
  recipient: string;
  destinationAssetId: string;
  destinationAmount: string;
  destinationVolume: string;
  destinationSymbol: string;
  destinationNetwork: string;
  destinationTxHash: string;
  status: string;
  submittedAt: string;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollExecution {
  executionId: number;
  type: string;
  title: string;
  total: number;
  processed: number;
  created: number;
  processing: number;
  completed: number;
  failed: number;
  expired: number;
  finished: boolean;
  list: PayrollExecutionItem[];
}

export const VOLUME_PERIOD = {
  Daily: "day",
  Weekly: "week",
  Monthly: "month",
} as const;

export type VolumePeriod = (typeof VOLUME_PERIOD)[keyof typeof VOLUME_PERIOD];

export type VolumePoint = {
  label: string;
  value: number;
};

/**
 * Body of `POST /v1/payroll/payments`. The backend creates a hosted checkout
 * session on our behalf, so the field names are the backend's snake_case.
 * `memo` is not in the Swagger contract yet; it is capped at 200 characters.
 */
export interface PayrollPaymentNotification {
  email?: string;
  slack?: string;
}

export interface PayrollCreatePaymentParam {
  amount: string;
  /** 1Click blockchain code, e.g. `eth` / `base` / `near`. */
  network: string;
  recipient: string;
  symbol: string;
  organization_id: number | null;
  memo?: string;
  success_url?: string;
  notification?: PayrollPaymentNotification;
}

export interface PayrollPayoutRetryParam {
  execution_item_id: number;
  organization_id: number;
  success_url: string;
}

/** Builds `POST /payments` `notification`. Empty email/slack keys are omitted. */
export function payrollPaymentNotification(input: {
  email?: string;
  slack?: string;
}): PayrollPaymentNotification | undefined {
  const email = input.email?.trim() ?? "";
  const slack = input.slack?.trim() ?? "";
  if (!email && !slack) return undefined;
  return {
    ...(email ? { email } : {}),
    ...(slack ? { slack } : {}),
  };
}

export interface PayrollPayment {
  paymentId: string;
  payUrl: string;
  paySessionId: string;
  payPaymentId: string;
  status: string;
  payer: string;
  recipient: string;
  sourceAmount: string;
  sourceSymbol: string;
  sourceNetwork: string;
  destinationAmount: string;
  destinationSymbol: string;
  destinationNetwork: string;
  destinationTxHash: string;
  txHash: string;
  memo: string | null;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollCreateBatchPaymentParam {
  amount: string;
  recipient: string;
  network: string;
  symbol: string;
  memo?: string;
}

export interface PayrollBatchPayment extends PayrollPayment {
  batchId: string;
  payDepositAddress: string;
}

export interface PayrollBatch {
  quoteId: string;
  batchId: string;
  deadline: string;
  payer: string;
  sourceContract: string;
  sourceDecimals: number | null;
  sourceNetwork: string;
  sourceSymbol: string;
  totalSourceAmount: string;
  totalSourceAmountRaw: string;
  transaction: PayBatchSwapTransaction;
  payments: PayrollBatchPayment[];
}
