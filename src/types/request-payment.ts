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
