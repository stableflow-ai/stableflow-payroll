import type { ChainKind, IntentSignedPayload } from "@/wallet";

export const NEARINTENTS_INTENT_STANDARD: Record<ChainKind, "erc191" | "nep413" | "raw_ed25519" | "tip191"> = {
  evm: "erc191",
  near: "nep413",
  solana: "raw_ed25519",
  tron: "tip191",
};

export const NEARINTENTS_DEPOSIT_TYPE = {
  ConfidentialIntents: "CONFIDENTIAL_INTENTS",
} as const;

export const NEARINTENTS_RECIPIENT_TYPE = {
  DestinationChain: "DESTINATION_CHAIN",
} as const;

export const NEARINTENTS_SWAP_TYPE = {
  ExactInput: "EXACT_INPUT",
} as const;

export const NEARINTENTS_CONFIDENTIALITY = {
  Advanced: "advanced",
} as const;

export const NEARINTENTS_INTENT_TYPE = {
  SwapTransfer: "swap_transfer",
} as const;

export interface NearintentsQuoteParam {
  dry: boolean;
  swapType: "EXACT_INPUT" | "EXACT_OUTPUT";
  originAsset: string;
  depositType: "CONFIDENTIAL_INTENTS";
  destinationAsset: string;
  amount: string;
  recipient: string;
  recipientType: "DESTINATION_CHAIN";
  refundTo: string;
  refundType: "CONFIDENTIAL_INTENTS";
  confidentiality: "advanced";
  deadline: string;
  slippageTolerance: number;
}

export interface NearintentsQuoteResp {
  correlationId?: string;
  message?: string;
  quote?: {
    depositAddress?: string;
    depositMemo?: string;
    amountIn?: string;
    amountOut?: string;
    deadline?: string;
  };
}

export interface NearintentsGenerateIntentParam {
  type: "swap_transfer";
  standard: string;
  signerId: string;
  depositAddress: string;
}

export interface NearintentsGenerateIntentResp {
  intent: {
    standard: string;
    payload: unknown;
  };
  correlationId?: string;
}

export interface NearintentsSubmitIntentParam {
  type: "swap_transfer";
  signedData: IntentSignedPayload;
}

export interface NearintentsSubmitIntentResp {
  intentHash?: string;
  correlationId?: string;
}

export interface NearintentsStatusResp {
  status?: string;
}
