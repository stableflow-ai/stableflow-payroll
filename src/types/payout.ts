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

export interface PayBatchSwapTransaction {
  approvals: string[] | null;
  callData: string;
  batch_contract: string;
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
