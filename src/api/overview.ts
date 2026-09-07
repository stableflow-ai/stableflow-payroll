import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { http } from "@/lib/http";
import type {
  MemberOverviewPayoutPoint,
  MemberOverviewStats,
} from "@/types/overview";
import type { VolumePeriod } from "@/types/payout";

export function mapMemberOverviewStats(raw: unknown): MemberOverviewStats {
  const row = asRecord(raw) ?? {};
  return {
    totalIncome: apiText(row.total_income ?? row.totalIncome),
    incomeTxCount: apiNumber(row.payment_transactions ?? row.paymentTransactions) ?? 0,
    totalPayout: apiText(row.total_payout ?? row.totalPayout),
    payoutTxCount: apiNumber(row.payout_transactions ?? row.payoutTransactions) ?? 0,
  };
}

function mapMemberPayoutPoint(raw: unknown): MemberOverviewPayoutPoint | null {
  const row = asRecord(raw);
  if (!row) return null;
  const label = apiText(row.time).trim();
  if (!label) return null;
  return {
    label,
    income: apiNumber(row.income) ?? 0,
    payout: apiNumber(row.payout) ?? 0,
    incomeTx: apiNumber(row.income_transactions ?? row.incomeTransactions) ?? 0,
    payoutTx: apiNumber(row.payout_transactions ?? row.payoutTransactions) ?? 0,
  };
}

export function mapMemberOverviewPayoutPoints(raw: unknown): MemberOverviewPayoutPoint[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row) => {
    const point = mapMemberPayoutPoint(row);
    return point ? [point] : [];
  });
}

export async function getMemberOverview(organizationId: number) {
  return mapMemberOverviewStats(
    await http<unknown>(`${PAY_API_PREFIX}/overview`, {
      query: { organization_id: organizationId },
    }),
  );
}

export async function getMemberOverviewPayout(params: {
  organizationId: number;
  period: VolumePeriod;
  timezone: string;
}) {
  return mapMemberOverviewPayoutPoints(
    await http<unknown>(`${PAY_API_PREFIX}/overview/payout`, {
      query: {
        organization_id: params.organizationId,
        period: params.period,
        timezone: params.timezone,
      },
    }),
  );
}
