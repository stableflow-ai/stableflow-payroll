import type { IntentSignedPayload } from "@/wallet";

export interface PayCreateRequestParam {
  amount: string;
  mode: "standard" | "private";
  network: string;
  recipient_address: string;
  token: string;
  memo?: string;
  private_recipient_address?: string;
}

export interface PayCreateRequestResp {
  id: number;
}

export interface PayRequestItem {
  id: number;
  amount: string;
  mode: string;
  network: string;
  private_recipient_address: string;
  recipient_address: string;
  status: string;
  token: string;
  memo: string;
  created_at: string;
}

export interface PayWithdrawParam {
  deposit_address: string;
  request_id: number;
  signedData: IntentSignedPayload;
}

export interface PayRequestWithdrawCount {
  count: number;
}
