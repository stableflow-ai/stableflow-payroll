export interface PayPartner {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  company: string;
  purpose: string;
  website: string;
  telegram: string;
  description: string;
  createdAt: string;
}

export interface PayCreatePartnerBody {
  first_name: string;
  last_name: string;
  company: string;
  purpose: string;
  website: string;
  telegram: string;
  description: string;
}

export interface PayCreatePartnerResp {
  id: number;
}

export interface PayPartnerKey {
  id: number;
  userId: number;
  label: string;
  apiKey: string;
  createdAt: string;
  status: number;
}

export interface PayPartnerKeyLabelBody {
  label: string;
}

export interface PayPartnerAnalyticsQuery {
  start_time?: number;
  end_time?: number;
  api_key_id?: number;
  network?: string;
}

export interface PayPartnerAnalyticsDailyItem {
  date: string;
  totalAmount: string;
  transactionCount: number;
}

export interface PayPartnerAnalyticsTokenItem {
  token: string;
  totalAmount: string;
  transactionCount: number;
}

export interface PayPartnerAnalyticsResp {
  totalVolume: string;
  dailyStats: PayPartnerAnalyticsDailyItem[];
  tokenStats: PayPartnerAnalyticsTokenItem[];
}

export interface PayPartnerPaymentsQuery {
  page: number;
  pageSize: number;
  api_key_id?: number;
  network?: string;
  token?: string;
  destination_network?: string;
  destination_token?: string;
  min_amount?: number;
  max_amount?: number;
}

export interface PayPartnerPaymentItem {
  id: number;
  apiKeyId: number;
  payer: string;
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
  memo: string | null;
}

export interface PayPartnerPaymentsResp {
  total: number;
  totalPage: number;
  list: PayPartnerPaymentItem[];
}
