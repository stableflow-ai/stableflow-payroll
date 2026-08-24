import { useState } from "react";
import { useAnalytics } from "@/hooks/use-analytics";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { VolumeRange } from "@/mocks/analytics";
import { DEFAULT_MONTH, DEFAULT_VOLUME_RANGE } from "./config";
import { AssetDistributionCard } from "./components/AssetDistributionCard";
import { LatestPayoutsCard } from "./components/LatestPayoutsCard";
import { PaymentCalendarCard } from "./components/PaymentCalendarCard";
import { PayoutNetworksCard } from "./components/PayoutNetworksCard";
import { TotalPaymentCard } from "./components/TotalPaymentCard";
import { YearMonthPicker } from "./components/YearMonthPicker";

const DESKTOP_CHART_QUERY = "(min-width: 1024px)";

export function AnalyticsView() {
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [range, setRange] = useState<VolumeRange>(DEFAULT_VOLUME_RANGE);
  const dashboard = useAnalytics(month, range);
  const showBarLabels = useMediaQuery(DESKTOP_CHART_QUERY);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-montserrat text-[26px] font-semibold text-black">Analytics</h1>
        <YearMonthPicker value={month} onChange={setMonth} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,456px)]">
        <TotalPaymentCard
          totalPaymentUsd={dashboard.totalPaymentUsd}
          totalPayouts={dashboard.totalPayouts}
          recipients={dashboard.recipients}
          range={range}
          onRangeChange={setRange}
          points={dashboard.volume}
          showBarLabels={showBarLabels}
        />
        <LatestPayoutsCard items={dashboard.latestPayouts} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <PaymentCalendarCard month={month} days={dashboard.calendarDays} />
        <AssetDistributionCard items={dashboard.assets} />
        <PayoutNetworksCard items={dashboard.networks} />
      </div>
    </div>
  );
}
