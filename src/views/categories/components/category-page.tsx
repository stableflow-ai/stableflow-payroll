import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useOperationCurrentStatsQuery,
  useOperationImportMutation,
  useOperationOpenQuery,
  useOperationRecentPayoutsInfiniteQuery,
  useOperationTotalPayoutQuery,
} from "@/hooks/use-operation-api";
import useToast from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth";
import { OPERATION_TOTAL_PAYOUT_PERIOD, type OperationDraftRow, type OperationImportItem, type OperationTotalPayoutPeriod } from "@/types/operation";
import type { Payable } from "@/types/payable";
import { ExpenseFormDrawer } from "@/views/expense/components/expense-form-drawer";
import { RecentPayoutsCard } from "@/views/expense/components/recent-payouts";
import { TotalExpenseChart } from "@/views/expense/components/total-expense";
import { EXPENSE_PAYOUT_STATUS } from "@/views/expense/config";
import { mapExpenseChartSeries } from "@/views/expense/utils";
import { PaymentByFormDialog } from "@/views/pay/components/payment-form/PaymentByFormDialog";
import { categoryHistoryPath, categoryPath, type CategoryItem } from "../config";
import { OPERATION_TAB } from "../live-config";
import { OperationRunsCard } from "./live/runs-card";
import { OperationStatsCard } from "./live/stats";

function queryErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function CategoryPage(props: { item: CategoryItem }) {
  const { item } = props;
  const category = item.category;
  const toast = useToast();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const organizationId = useAuthStore((state) => state.user?.organization?.id ?? null);
  const current = useOperationCurrentStatsQuery(category);
  const openQuery = useOperationOpenQuery(category);
  const recent = useOperationRecentPayoutsInfiniteQuery(category);
  const importMutation = useOperationImportMutation();
  const tab =
    pathname === categoryHistoryPath(category)
      ? OPERATION_TAB.History
      : OPERATION_TAB.Payments;
  const [chartRange, setChartRange] = useState<OperationTotalPayoutPeriod>(
    OPERATION_TOTAL_PAYOUT_PERIOD.Month,
  );
  const totalPayout = useOperationTotalPayoutQuery(category, chartRange);
  const [payingForm, setPayingForm] = useState<Payable | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSeed, setDrawerSeed] = useState(0);
  const [importRows, setImportRows] = useState<OperationDraftRow[] | null>(null);

  const chartSeries = useMemo(
    () => mapExpenseChartSeries(totalPayout.data ?? [], chartRange),
    [chartRange, totalPayout.data],
  );
  const recentItems = useMemo(
    () => recent.data?.pages.flat() ?? [],
    [recent.data],
  );
  const failedRecentCount = recentItems.filter(
    (row) => row.status === EXPENSE_PAYOUT_STATUS.Failed,
  ).length;

  function openAddDrawer(rows?: OperationDraftRow[]) {
    setImportRows(rows && rows.length > 0 ? rows : null);
    setDrawerSeed((seed) => seed + 1);
    setDrawerOpen(true);
  }

  async function handleDrawerSave(payload: {
    title: string;
    items: OperationImportItem[];
  }) {
    if (organizationId == null) {
      toast.fail({ title: "Organization is missing" });
      return;
    }
    try {
      const result = await importMutation.mutateAsync({
        organizationId,
        category,
        title: payload.title,
        items: payload.items,
      });
      toast.success({
        title:
          result.count > 0 ? `Saved ${result.count} payments` : "Payment saved",
      });
      setImportRows(null);
      setDrawerOpen(false);
      navigate(categoryPath(category));
    } catch (error) {
      toast.fail({
        title: queryErrorMessage(error, "Could not save payment"),
      });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <OperationStatsCard
        loading={current.isLoading}
        error={
          current.isError
            ? queryErrorMessage(current.error, "Failed to load payment stats")
            : null
        }
        totalPayout={current.data?.totalPayout ?? "0"}
        totalChangePercent={current.data?.totalChangePercent ?? null}
        payouts={current.data?.payouts ?? 0}
        payoutsChangePercent={current.data?.payoutsChangePercent ?? null}
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,452px)]">
        <TotalExpenseChart
          heading="Total Payment"
          range={chartRange}
          onRangeChange={setChartRange}
          periodLabel={chartSeries.periodLabel}
          currentValue={chartSeries.currentValue}
          points={chartSeries.points}
          loading={totalPayout.isLoading}
          error={
            totalPayout.isError
              ? queryErrorMessage(totalPayout.error, "Failed to load payment chart")
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
          onOpenHistory={() => navigate(categoryHistoryPath(category))}
        />
      </div>
      <OperationRunsCard
        category={category}
        tab={tab}
        open={openQuery.data ?? { total: "0", count: 0, batches: [] }}
        openLoading={openQuery.isLoading}
        openError={
          openQuery.isError
            ? queryErrorMessage(openQuery.error, "Failed to load open payments")
            : null
        }
        onPayNow={(form) => setPayingForm(form)}
        onAdd={() => openAddDrawer()}
        onImported={openAddDrawer}
        importBusy={importMutation.isPending}
      />
      <PaymentByFormDialog
        open={Boolean(payingForm)}
        form={payingForm}
        onClose={() => setPayingForm(null)}
      />
      <ExpenseFormDrawer
        key={`${drawerOpen ? "open" : "closed"}-${drawerSeed}`}
        open={drawerOpen}
        title="Add Payment"
        titleLabel="Payment Title"
        initialRows={importRows ?? undefined}
        saving={importMutation.isPending}
        onClose={() => {
          if (importMutation.isPending) return;
          setDrawerOpen(false);
          setImportRows(null);
        }}
        onSave={handleDrawerSave}
      />
    </div>
  );
}
