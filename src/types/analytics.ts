export interface PayAnalyticsStats {
  totalPayment: string | null;
  recipients: number | null;
  totalPayouts: number | null;
}

export interface PayAnalyticsCalendarDay {
  date: string;
  totalPayment: string;
  transactionCount: number;
}

export interface PayAnalyticsAssetShare {
  token: string;
  totalPayment: string;
  percentage: string;
}

export interface PayAnalyticsNetworkShare {
  network: string;
  totalPayment: string;
  percentage: string;
}

export interface PayAnalyticsResp {
  month: string;
  stats: PayAnalyticsStats;
  paymentCalendar: PayAnalyticsCalendarDay[];
  assetDistribution: PayAnalyticsAssetShare[];
  payoutNetworks: PayAnalyticsNetworkShare[];
}
