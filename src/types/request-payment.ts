import type { IntentSignedPayload } from "@/wallet";

export interface PayCreateRequestParam {
  amount: string;
  mode: "standard" | "private";
  network: string;
  recipient_address: string;
  token: string;
  name: string;
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
  name: string;
  memo: string;
  created_at: string;
  payer: string;
  paid_at: string;
  destination_tx_hash: string;
  withdraw_tx_hash: string;
}

export interface PayWithdrawParam {
  deposit_address: string;
  request_id: number;
  signedData: IntentSignedPayload;
}

export interface PayRequestWithdrawCount {
  count: number;
}
