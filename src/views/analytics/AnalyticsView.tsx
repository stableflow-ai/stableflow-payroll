import { useMemo, useState } from "react";
import { chainDisplayName } from "@/config/chains";
import { useAnalyticsQuery } from "@/hooks/use-analytics-api";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePaymentVolumeQuery, useRecentPaymentsQuery } from "@/hooks/use-payout-api";
import type { VolumePeriod } from "@/types/payout";
import {
  paymentDisplayNetwork,
  paymentDisplayToken,
} from "@/views/pay/utils";
import { PAYOUT_ROW_STATUS, paymentRowStatus } from "@/views/pay/components/payout-table/PayoutStatusCell";
import {
  DEFAULT_MONTH,
  DEFAULT_VOLUME_PERIOD,
  LATEST_PAYOUTS_LIMIT,
  PAYOUT_NETWORKS_LIMIT,
  type AssetShare,
  type CalendarDay,
  type LatestPayout,
  type NetworkShare,
} from "./config";
import { AnalyticsSkeleton } from "./components/AnalyticsSkeleton";
import { AssetDistributionCard } from "./components/AssetDistributionCard";
import { LatestPayoutsCard } from "./components/LatestPayoutsCard";
import { PaymentCalendarCard } from "./components/PaymentCalendarCard";
import { PayoutNetworksCard } from "./components/PayoutNetworksCard";
import { TotalPaymentCard } from "./components/TotalPaymentCard";
import { YearMonthPicker } from "./components/YearMonthPicker";

const DESKTOP_CHART_QUERY = "(min-width: 1024px)";

function latestStatusLabel(status: string) {
  const row = paymentRowStatus(status);
  if (row === PAYOUT_ROW_STATUS.Complete) return "Complete";
  if (row === PAYOUT_ROW_STATUS.Failed) return "Failed";
  return "In Progress";
}

export function AnalyticsView() {
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [range, setRange] = useState<VolumePeriod>(DEFAULT_VOLUME_PERIOD);
  const analytics = useAnalyticsQuery(month);
  const volume = usePaymentVolumeQuery(range);
  const recent = useRecentPaymentsQuery();
  const showBarLabels = useMediaQuery(DESKTOP_CHART_QUERY);

  const calendarDays = useMemo((): CalendarDay[] => {
    return (analytics.data?.paymentCalendar ?? []).map((day) => ({
      date: day.date,
      paymentUsd: Number(day.totalPayment) || 0,
      payouts: day.transactionCount,
    }));
  }, [analytics.data]);

  const assets = useMemo((): AssetShare[] => {
    return (analytics.data?.assetDistribution ?? []).map((item) => ({
      symbol: item.token,
      percent: Number(item.percentage) || 0,
    }));
  }, [analytics.data]);

  const networks = useMemo((): NetworkShare[] => {
    return [...(analytics.data?.payoutNetworks ?? [])]
      .sort((a, b) => Number(b.totalPayment) - Number(a.totalPayment))
      .slice(0, PAYOUT_NETWORKS_LIMIT)
      .map((item) => ({
        network: chainDisplayName(item.network),
        percent: Number(item.percentage) || 0,
      }));
  }, [analytics.data]);

  const latest = useMemo((): LatestPayout[] => {
    return (recent.data ?? []).slice(0, LATEST_PAYOUTS_LIMIT).map((item) => ({
      id: item.id,
      statusLabel: latestStatusLabel(item.status),
      time: item.submittedAt,
      origin: { symbol: item.token, network: item.network },
      dest: {
        symbol: paymentDisplayToken(item),
        network: paymentDisplayNetwork(item),
      },
    }));
  }, [recent.data]);

  const points = (volume.data ?? []).map((point) => ({
    label: point.label,
    value: point.value,
    changePercent: null as number | null,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-montserrat text-[26px] font-semibold text-black">Analytics</h1>
        <YearMonthPicker value={month} onChange={setMonth} />
      </div>

      {analytics.isPending ? (
        <AnalyticsSkeleton />
      ) : analytics.isError ? (
        <p className="font-montserrat text-sm text-danger">
          {analytics.error instanceof Error ? analytics.error.message : "Failed to load analytics"}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,456px)]">
            <TotalPaymentCard
              totalPaymentUsd={analytics.data?.stats.totalPayment ?? null}
              totalPayouts={analytics.data?.stats.totalPayouts ?? null}
              recipients={analytics.data?.stats.recipients ?? null}
              range={range}
              onRangeChange={setRange}
              points={points}
              showBarLabels={showBarLabels}
            />
            <LatestPayoutsCard items={latest} />
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <PaymentCalendarCard month={month} days={calendarDays} />
            <AssetDistributionCard items={assets} />
            <PayoutNetworksCard items={networks} />
          </div>
        </>
      )}
    </div>
  );
}
