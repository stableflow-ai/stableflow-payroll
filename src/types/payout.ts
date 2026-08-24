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
  callData: string;
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
