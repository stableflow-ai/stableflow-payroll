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

export const PAYMENT_REQUEST_STATUS = {
  Pending: "pending",
  Created: "created",
  Processing: "processing",
  Completed: "completed",
  Failed: "failed",
  Expired: "expired",
} as const;

export type PaymentRequestStatus =
  (typeof PAYMENT_REQUEST_STATUS)[keyof typeof PAYMENT_REQUEST_STATUS];

export interface PaymentRequestItem {
  batchId: number;
  title: string;
  userId: number;
  name: string;
  email: string;
  purpose: string;
  description: string;
  amount: string;
  symbol: string;
  network: string;
  recipient: string;
  status: string;
  paymentId: string;
  payerUserId: number;
  payer: string;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
  destinationTxHash: string;
}

export interface CreatePaymentRequestParam {
  amount: string;
  description?: string;
  network: string;
  organizationId: number;
  purpose: string;
  recipient: string;
  symbol: string;
  setDefaultAddress: boolean;
}

export interface PaymentRequestListQuery {
  organizationId: number;
  page: number;
  pageSize: number;
  status?: PaymentRequestStatus;
}

export interface PaymentRequestListResp {
  list: PaymentRequestItem[];
  total: number;
  totalPage: number;
}

export interface PaymentRequestDefaultAddress {
  address: string;
  network: string;
}

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
