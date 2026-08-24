import { http } from "@/lib/http";
import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import type { PayAnalyticsResp } from "@/types/analytics";

export async function getPayAnalytics(month: string): Promise<PayAnalyticsResp> {
  const data = asRecord(await http<unknown>(`${PAY_API_PREFIX}/analytics`, { query: { month } })) ?? {};
  const stats = asRecord(data.stats) ?? {};
  const calendar = Array.isArray(data.payment_calendar) ? data.payment_calendar : [];
  const assets = Array.isArray(data.asset_distribution) ? data.asset_distribution : [];
  const networks = Array.isArray(data.payout_networks) ? data.payout_networks : [];
  return {
    month: apiText(data.month) || month,
    stats: {
      totalPayment: apiText(stats.total_payment ?? stats.totalPayment) || null,
      recipients: apiNumber(stats.recipients),
      totalPayouts: apiNumber(stats.total_payouts ?? stats.totalPayouts),
    },
    paymentCalendar: calendar.map((item) => {
      const row = asRecord(item) ?? {};
      return {
        date: apiText(row.date),
        totalPayment: apiText(row.total_payment ?? row.totalPayment),
        transactionCount: apiNumber(row.transaction_count ?? row.transactionCount) ?? 0,
      };
    }),
    assetDistribution: assets.map((item) => {
      const row = asRecord(item) ?? {};
      return {
        token: apiText(row.token),
        totalPayment: apiText(row.total_payment ?? row.totalPayment),
        percentage: apiText(row.percentage),
      };
    }),
    payoutNetworks: networks.map((item) => {
      const row = asRecord(item) ?? {};
      return {
        network: apiText(row.network),
        totalPayment: apiText(row.total_payment ?? row.totalPayment),
        percentage: apiText(row.percentage),
      };
    }),
  };
}
