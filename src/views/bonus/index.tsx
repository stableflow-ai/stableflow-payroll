import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useBonusOverviewQuery } from "@/hooks/use-bonus-api";
import { IconLoading } from "@/components/icons/loading";
import { Switch } from "@/components/ui/switch/Switch";
import type { PayLayoutOutletContext } from "@/layouts/PayLayout";
import { PaymentByFormDialog } from "@/views/pay/components/payment-form/PaymentByFormDialog";
import type { BonusPendingList } from "@/mocks/bonus";
import { BonusFormDrawer } from "./components/bonus-form-drawer";
import { BonusRunsCard } from "./components/bonus-runs";
import { RecentPayoutsCard } from "./components/recent-payouts";
import { StatsCard } from "./components/stats";
import { TotalBonusChart } from "./components/total-bonus";
import {
  BONUS_CHART_RANGE,
  BONUS_DRAWER_MODE,
  BONUS_MOCK_VARIANT,
  BONUS_TAB,
  type BonusChartRange,
  type BonusDrawerMode,
  type BonusMockVariant,
  type BonusTab,
} from "./config";

export function BonusView() {
  const { setHeaderExtra } = useOutletContext<PayLayoutOutletContext>();
  const [variant, setVariant] = useState<BonusMockVariant>(
    BONUS_MOCK_VARIANT.Filled,
  );
  const overview = useBonusOverviewQuery(variant);
  const [tab, setTab] = useState<BonusTab>(BONUS_TAB.ToBePaid);
  const [chartRange, setChartRange] = useState<BonusChartRange>(
    BONUS_CHART_RANGE.Months6,
  );
  const [drawerMode, setDrawerMode] = useState<BonusDrawerMode | null>(null);
  const [pendingOverride, setPendingOverride] = useState<BonusPendingList | null>(null);
  const [payingFormId, setPayingFormId] = useState<string | null>(null);

  useEffect(() => {
    setHeaderExtra(
      <label className="flex items-center gap-2">
        <span className="font-montserrat text-sm text-[#606060]">Sample data</span>
        <Switch
          checked={variant === BONUS_MOCK_VARIANT.Filled}
          onCheckedChange={(checked) => {
            setVariant(
              checked ? BONUS_MOCK_VARIANT.Filled : BONUS_MOCK_VARIANT.Empty,
            );
            setPendingOverride(null);
            setDrawerMode(null);
            setPayingFormId(null);
          }}
          aria-label="Sample data"
        />
      </label>,
    );
    return () => setHeaderExtra(null);
  }, [setHeaderExtra, variant]);

  const data = overview.data;
  const pending = pendingOverride ?? data?.pending ?? null;

  if (overview.isPending || !data) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <IconLoading className="size-5 animate-spin text-[#909090]" />
      </div>
    );
  }

  if (overview.isError) {
    return (
      <p className="font-montserrat text-sm text-danger">
        {overview.error instanceof Error
          ? overview.error.message
          : "Failed to load bonus"}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <StatsCard
        totalBonus={data.totalBonus}
        totalBonusToken={data.totalBonusToken}
        totalChangePercent={data.totalChangePercent}
        members={data.members}
        membersChangePercent={data.membersChangePercent}
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,452px)]">
        <TotalBonusChart
          range={chartRange}
          onRangeChange={setChartRange}
          periodLabel={data.chartPeriodLabel}
          currentValue={data.chartCurrentValue}
          points={data.chartPoints}
        />
        <RecentPayoutsCard
          items={data.recentPayouts}
          failedCount={data.failedRecentCount}
        />
      </div>
      <BonusRunsCard
        tab={tab}
        onTabChange={setTab}
        pending={pending}
        history={data.history}
        onAddBonus={() => setDrawerMode(BONUS_DRAWER_MODE.Add)}
        onPayNow={(formId) => setPayingFormId(formId)}
      />
      <PaymentByFormDialog
        open={Boolean(payingFormId)}
        formId={payingFormId}
        onClose={() => setPayingFormId(null)}
      />
      <BonusFormDrawer
        key={drawerMode ?? "closed"}
        open={drawerMode !== null}
        mode={drawerMode ?? BONUS_DRAWER_MODE.Add}
        onClose={() => setDrawerMode(null)}
        onSave={(list) => {
          setPendingOverride(list);
          setDrawerMode(null);
        }}
      />
    </div>
  );
}
