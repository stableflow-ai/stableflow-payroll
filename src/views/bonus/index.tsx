import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  useBonusCurrentStatsQuery,
  useBonusHistoryExportMutation,
  useBonusHistoryInfiniteQuery,
  useBonusImportMutation,
  useBonusOpenQuery,
  useBonusRecentPayoutsInfiniteQuery,
  useBonusTotalPayoutQuery,
} from "@/hooks/use-bonus-api";
import useToast from "@/hooks/use-toast";
import type { PayLayoutOutletContext } from "@/layouts/PayLayout";
import { useAuthStore } from "@/stores/auth";
import type { BonusImportItem, BonusPendingRow } from "@/types/bonus";
import type { PayableKey } from "@/types/payable";
import { PaymentByFormDialog } from "@/views/pay/components/payment-form/PaymentByFormDialog";
import { BonusFormDrawer } from "./components/bonus-form-drawer";
import { BonusRunsCard } from "./components/bonus-runs";
import { RecentPayoutsCard } from "./components/recent-payouts";
import { StatsCard } from "./components/stats";
import { TotalBonusChart } from "./components/total-bonus";
import { mapBonusChartSeries } from "./utils";
import {
  BONUS_CHART_RANGE,
  BONUS_DRAWER_MODE,
  BONUS_PAYOUT_STATUS,
  BONUS_TAB,
  type BonusChartRange,
  type BonusDrawerMode,
  type BonusTab,
} from "./config";

function queryErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function BonusView() {
  const { setHeaderExtra } = useOutletContext<PayLayoutOutletContext>();
  const toast = useToast();
  const organizationId = useAuthStore(
    (state) => state.user?.organization?.id ?? null,
  );
  const current = useBonusCurrentStatsQuery();
  const openQuery = useBonusOpenQuery();
  const historyQuery = useBonusHistoryInfiniteQuery();
  const recent = useBonusRecentPayoutsInfiniteQuery();
  const importMutation = useBonusImportMutation();
  const historyExportMutation = useBonusHistoryExportMutation();
  const [tab, setTab] = useState<BonusTab>(BONUS_TAB.ToBePaid);
  const [chartRange, setChartRange] = useState<BonusChartRange>(
    BONUS_CHART_RANGE.Month,
  );
  const totalPayout = useBonusTotalPayoutQuery(chartRange);
  const [drawerMode, setDrawerMode] = useState<BonusDrawerMode | null>(null);
  const [drawerSeed, setDrawerSeed] = useState(0);
  const [importRows, setImportRows] = useState<BonusPendingRow[] | null>(null);
  const [payingPayable, setPayingPayable] = useState<PayableKey | null>(null);

  useEffect(() => {
    setHeaderExtra(null);
    return () => setHeaderExtra(null);
  }, [setHeaderExtra]);

  const chartSeries = useMemo(
    () => mapBonusChartSeries(totalPayout.data ?? [], chartRange),
    [chartRange, totalPayout.data],
  );
  const recentItems = useMemo(
    () => recent.data?.pages.flat() ?? [],
    [recent.data],
  );
  const historyItems = useMemo(
    () => historyQuery.data?.pages.flatMap((page) => page.list) ?? [],
    [historyQuery.data],
  );
  const failedRecentCount = recentItems.filter(
    (item) => item.status === BONUS_PAYOUT_STATUS.Failed,
  ).length;
  const pending = openQuery.data ?? null;
  const drawerSaving = importMutation.isPending;

  function openAddDrawer(rows?: BonusPendingRow[]) {
    setImportRows(rows && rows.length > 0 ? rows : null);
    setDrawerSeed((seed) => seed + 1);
    setDrawerMode(BONUS_DRAWER_MODE.Add);
  }

  async function handleDrawerSave(payload: {
    title: string;
    items: BonusImportItem[];
  }) {
    if (organizationId == null) {
      toast.fail({ title: "Organization is missing" });
      return;
    }
    try {
      const result = await importMutation.mutateAsync({
        organizationId,
        title: payload.title,
        items: payload.items,
      });
      toast.success({
        title: result.count > 0 ? `Saved ${result.count} recipients` : "Bonus saved",
      });
      setImportRows(null);
      setDrawerMode(null);
      setTab(BONUS_TAB.ToBePaid);
    } catch (error) {
      toast.fail({
        title: queryErrorMessage(error, "Could not save bonus"),
      });
    }
  }

  async function handleExport() {
    if (organizationId == null) {
      toast.fail({ title: "Organization is missing" });
      return;
    }
    try {
      await historyExportMutation.mutateAsync();
    } catch (error) {
      toast.fail({
        title: queryErrorMessage(error, "Could not export bonus history"),
      });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <StatsCard
        loading={current.isLoading}
        error={
          current.isError
            ? queryErrorMessage(current.error, "Failed to load bonus stats")
            : null
        }
        totalBonus={current.data?.totalBonus ?? "0"}
        totalChangePercent={current.data?.totalChangePercent ?? null}
        members={current.data?.members ?? 0}
        membersChangePercent={current.data?.membersChangePercent ?? null}
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,452px)]">
        <TotalBonusChart
          range={chartRange}
          onRangeChange={setChartRange}
          periodLabel={chartSeries.periodLabel}
          currentValue={chartSeries.currentValue}
          points={chartSeries.points}
          loading={totalPayout.isLoading}
          error={
            totalPayout.isError
              ? queryErrorMessage(totalPayout.error, "Failed to load bonus chart")
              : null
          }
        />
        <RecentPayoutsCard
          items={recentItems}
          failedCount={failedRecentCount}
          loading={recent.isLoading}
          loadingMore={recent.isFetchingNextPage}
          hasMore={Boolean(recent.hasNextPage)}
          error={
            recent.isError
              ? queryErrorMessage(recent.error, "Failed to load recent payouts")
              : null
          }
          onLoadMore={() => {
            if (!recent.hasNextPage || recent.isFetchingNextPage) return;
            void recent.fetchNextPage();
          }}
          onOpenHistory={() => setTab(BONUS_TAB.History)}
        />
      </div>
      <BonusRunsCard
        tab={tab}
        onTabChange={setTab}
        pending={pending}
        pendingLoading={openQuery.isLoading}
        pendingError={
          openQuery.isError
            ? queryErrorMessage(openQuery.error, "Failed to load bonuses to be paid")
            : null
        }
        history={historyItems}
        historyLoading={historyQuery.isLoading}
        historyError={
          historyQuery.isError
            ? queryErrorMessage(historyQuery.error, "Failed to load bonus history")
            : null
        }
        historyLoadingMore={historyQuery.isFetchingNextPage}
        historyHasMore={Boolean(historyQuery.hasNextPage)}
        onHistoryLoadMore={() => {
          if (!historyQuery.hasNextPage || historyQuery.isFetchingNextPage) return;
          void historyQuery.fetchNextPage();
        }}
        onAddBonus={() => openAddDrawer()}
        onImported={openAddDrawer}
        importBusy={drawerSaving}
        onPayNow={(payable) => setPayingPayable(payable)}
        onExport={handleExport}
        exporting={historyExportMutation.isPending}
      />
      <PaymentByFormDialog
        open={Boolean(payingPayable)}
        payable={payingPayable}
        onClose={() => setPayingPayable(null)}
      />
      <BonusFormDrawer
        key={`${drawerMode ?? "closed"}-${drawerSeed}`}
        open={drawerMode !== null}
        mode={drawerMode ?? BONUS_DRAWER_MODE.Add}
        initialRows={importRows ?? undefined}
        saving={drawerSaving}
        onClose={() => {
          if (drawerSaving) return;
          setDrawerMode(null);
          setImportRows(null);
        }}
        onSave={handleDrawerSave}
      />
    </div>
  );
}
