export interface PaySingleQuoteParam {
  amount: string;
  destinationAddress: string;
  destinationNetwork: string;
  destinationToken: string;
  network: string;
  refundTo: string;
  slippageTolerance: number;
  token: string;
  payer?: string;
  memo?: string;
  notifyEmail?: string;
  request_id?: number;
}

export interface PaySingleSwapParam extends PaySingleQuoteParam {
  memo?: string;
  notifyEmail?: string;
}

export interface PaySingleQuoteResp {
  amountIn: string;
  amountInFormatted: string;
  amountInUsd: string;
  deadline: string;
  timeEstimate: number;
}

export interface PaySingleSwapResp extends PaySingleQuoteResp {
  depositAddress: string;
  orderId: string;
}

export interface PaySingleSubmitParam {
  orderId: string;
  txHash: string;
}

export interface PayBatchReceive {
  address: string;
  amount: string;
  network: string;
  token: string;
  memo?: string;
}

export interface PayBatchQuoteParam {
  network: string;
  token: string;
  refundTo: string;
  slippageTolerance: number;
  receives: PayBatchReceive[];
  payer?: string;
}

export interface PayBatchQuoteResp {
  deadline: string;
  totalAmountIn: string;
  totalAmountInFormatted: string;
  totalAmountInUsd: string;
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

export interface PayBatchSwapTransaction {
  approvals: string[] | null;
  callData: string;
  batch_contract: string;
  receiverId?: string;
  actions?: PayBatchNearAction[];
  serializedTransaction?: string;
  lastValidBlockHeight?: number;
}

export interface PayBatchSwapResp extends PayBatchQuoteResp {
  orderId: string;
  transaction: PayBatchSwapTransaction;
}

export interface PayBatchSubmitParam {
  orderId: string;
  txHash: string;
}

export interface PayPaymentItem {
  id: string;
  recipient: string;
  amount: string;
  token: string;
  network: string;
  destinationAmount: string;
  destinationToken: string;
  destinationNetwork: string;
  destinationTxHash: string;
  txHash: string;
  status: string;
  submittedAt: string;
  paidAt: string;
  memo?: string | null;
}

export type PayPending = PayPaymentItem;

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

export interface PayOverview {
  totalPayment: string | null;
  recipients: number | null;
}

export interface PayPaymentsQuery {
  page: number;
  pageSize: number;
  q?: string;
  status?: string;
  token?: string;
  start_time?: number;
  end_time?: number;
}

export type PayPaymentsExportQuery = Pick<
  PayPaymentsQuery,
  "q" | "status" | "token" | "start_time" | "end_time"
>;

export interface PayPaymentsResp {
  total: number;
  totalPage: number;
  list: PayPaymentItem[];
}

/**
 * Body of `POST /v1/payroll/payments`. The backend creates a hosted checkout
 * session on our behalf, so the field names are the backend's snake_case.
 * `memo` is not in the Swagger contract yet; it is capped at 200 characters.
 */
export interface PayrollCreatePaymentParam {
  amount: string;
  /** 1Click blockchain code, e.g. `eth` / `base` / `near`. */
  network: string;
  recipient: string;
  symbol: string;
  memo?: string;
  success_url?: string;
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

/**
 * Body of `POST /v1/payroll/batches`. Field names are the backend's snake_case.
 * `notification` is omitted: the batch page does not collect email or Slack.
 */
export interface PayrollCreateBatchPaymentParam {
  amount: string;
  recipient: string;
  network: string;
  symbol: string;
  memo?: string;
}

export interface PayrollCreateBatchParam {
  payer: string;
  source_network: string;
  source_symbol: string;
  payments: PayrollCreateBatchPaymentParam[];
}

export interface PayrollBatchPayment extends PayrollPayment {
  batchId: string;
  payDepositAddress: string;
}

export interface PayrollBatch {
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
