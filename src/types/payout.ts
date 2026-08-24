export interface PayQuickQuoteParam {
  amount: string;
  destinationAsset: string;
  originAsset: string;
  refundTo: string;
  slippageTolerance: number;
  destinationAddress?: string;
  memo?: string;
  /** Recipient notification email. Omit when notify is off. */
  notification?: string;
}

export interface PayQuickQuoteResp {
  amountIn: string;
  amountInFormatted: string;
  amountInUsd: string;
  deadline: string;
  timeEstimate: number;
}

export interface PayQuickSwapResp extends PayQuickQuoteResp {
  callData: string;
  orderId: string;
}

export interface PayQuickSubmitParam {
  orderId: string;
  txHash: string;
}

export interface PayBatchReceive {
  amount: string;
  destinationAddress: string;
  destinationAsset: string;
  memo?: string;
}

export interface PayBatchQuoteParam {
  originAsset: string;
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

export interface PayBatchSwapResp extends PayBatchQuoteResp {
  orderId: string;
  approvals: string[];
  callData: string;
  spender: string;
}

export interface PayBatchSubmitParam {
  orderId: string;
  txHash: string;
}

export interface PayPending {
  recipient: string;
  amount: string;
  token: string;
  network: string;
  submittedAt: string;
  memo?: string | null;
  explorerUrl?: string | null;
  txUrl?: string | null;
  id?: string;
}
