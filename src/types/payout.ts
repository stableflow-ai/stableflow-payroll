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
