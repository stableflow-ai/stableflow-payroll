import { useMemo, useState } from "react";
import {
  useExpenseCurrentStatsQuery,
  useExpenseImportMutation,
  useExpenseOpenQuery,
  useExpenseOpenRequestsCountQuery,
  useExpenseRecentPayoutsInfiniteQuery,
  useExpenseTotalPayoutQuery
} from "@/hooks/use-expense-api";
import useToast from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth";
import type { ExpenseDraftRow, ExpenseImportItem } from "@/types/expense";
import type { PayableKey } from "@/types/payable";
import { PaymentByFormDialog } from "@/views/pay/components/payment-form/PaymentByFormDialog";
import { RecentPayoutsCard } from "./components/recent-payouts";
import { ExpenseRunsCard } from "./components/expense-runs";
import { ExpenseFormDrawer } from "./components/expense-form-drawer";
import { StatsCard } from "./components/stats";
import { TotalExpenseChart } from "./components/total-expense";
import { mapExpenseChartSeries } from "./utils";
import {
  EXPENSE_CHART_RANGE,
  EXPENSE_CHART_RANGE_PERIOD,
  EXPENSE_PAYOUT_STATUS,
  EXPENSE_TAB,
  type ExpenseChartRange,
  type ExpenseTab
} from "./config";

function queryErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function ExpenseView() {
  const toast = useToast();
  const organizationId = useAuthStore(
    (state) => state.user?.organization?.id ?? null
  );
  const current = useExpenseCurrentStatsQuery();
  const openQuery = useExpenseOpenQuery();
  const openRequestsCount = useExpenseOpenRequestsCountQuery();
  const recent = useExpenseRecentPayoutsInfiniteQuery();
  const importMutation = useExpenseImportMutation();
  const [tab, setTab] = useState<ExpenseTab>(EXPENSE_TAB.Open);
  const [chartRange, setChartRange] = useState<ExpenseChartRange>(
    EXPENSE_CHART_RANGE.Months6
  );
  const totalPayout = useExpenseTotalPayoutQuery(
    EXPENSE_CHART_RANGE_PERIOD[chartRange]
  );
  const [payingPayable, setPayingPayable] = useState<PayableKey | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSeed, setDrawerSeed] = useState(0);
  const [importRows, setImportRows] = useState<ExpenseDraftRow[] | null>(null);

  const chartSeries = useMemo(
    () => mapExpenseChartSeries(totalPayout.data ?? []),
    [totalPayout.data]
  );
  const recentItems = useMemo(
    () => recent.data?.pages.flat() ?? [],
    [recent.data]
  );
  const failedRecentCount = recentItems.filter(
    (item) => item.status === EXPENSE_PAYOUT_STATUS.Failed
  ).length;

  function openAddDrawer(rows?: ExpenseDraftRow[]) {
    setImportRows(rows && rows.length > 0 ? rows : null);
    setDrawerSeed((seed) => seed + 1);
    setDrawerOpen(true);
  }

  async function handleDrawerSave(payload: {
    title: string;
    items: ExpenseImportItem[];
  }) {
    if (organizationId == null) {
      toast.fail({ title: "Organization is missing" });
      return;
    }
    try {
      const result = await importMutation.mutateAsync({
        organizationId,
        title: payload.title,
        items: payload.items
      });
      toast.success({
        title:
          result.count > 0 ? `Saved ${result.count} expenses` : "Expense saved"
      });
      setImportRows(null);
      setDrawerOpen(false);
      setTab(EXPENSE_TAB.Open);
    } catch (error) {
      toast.fail({
        title: queryErrorMessage(error, "Could not save expense")
      });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <StatsCard
        loading={current.isLoading}
        error={
          current.isError
            ? queryErrorMessage(current.error, "Failed to load expense stats")
            : null
        }
        totalExpense={current.data?.totalExpense ?? "0"}
        totalChangePercent={current.data?.totalChangePercent ?? null}
        expensedCount={current.data?.expensedCount ?? 0}
        expensedChangePercent={current.data?.expensedChangePercent ?? null}
        expenseCount={current.data?.expenseCount ?? 0}
        expenseChangePercent={current.data?.expenseChangePercent ?? null}
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,452px)]">
        <TotalExpenseChart
          range={chartRange}
          onRangeChange={setChartRange}
          periodLabel={chartSeries.periodLabel}
          currentValue={chartSeries.currentValue}
          points={chartSeries.points}
          loading={totalPayout.isLoading}
          error={
            totalPayout.isError
              ? queryErrorMessage(
                  totalPayout.error,
                  "Failed to load expense chart"
                )
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
        />
      </div>
      <ExpenseRunsCard
        tab={tab}
        onTabChange={setTab}
        open={openQuery.data ?? { total: "0", count: 0, rows: [] }}
        openLoading={openQuery.isLoading}
        openError={
          openQuery.isError
            ? queryErrorMessage(openQuery.error, "Failed to load open expenses")
            : null
        }
        requestCount={openRequestsCount.data?.count ?? 0}
        onPayNow={(payable) => setPayingPayable(payable)}
        onAddExpense={() => openAddDrawer()}
        onImported={openAddDrawer}
        importBusy={importMutation.isPending}
      />
      <PaymentByFormDialog
        open={Boolean(payingPayable)}
        payable={payingPayable}
        onClose={() => setPayingPayable(null)}
      />
      <ExpenseFormDrawer
        key={`${drawerOpen ? "open" : "closed"}-${drawerSeed}`}
        open={drawerOpen}
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
