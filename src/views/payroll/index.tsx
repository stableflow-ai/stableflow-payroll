import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import {
  usePayrollCurrentStatsQuery,
  usePayrollHistoryExportMutation,
  usePayrollHistoryInfiniteQuery,
  usePayrollImportMutation,
  usePayrollNextQuery,
  usePayrollRecentPayoutsInfiniteQuery,
  usePayrollTotalPayoutQuery,
  usePayrollUpdateMutation,
} from "@/hooks/use-payroll-api";
import useToast from "@/hooks/use-toast";
import type { PayLayoutOutletContext } from "@/layouts/PayLayout";
import { useAuthStore } from "@/stores/auth";
import { PAYABLE_TYPE, type PayableKey } from "@/types/payable";
import { PaymentByFormDialog } from "@/views/pay/components/payment-form/PaymentByFormDialog";
import {
  PAYROLL_CHART_RANGE,
  PAYROLL_DRAWER_MODE,
  PAYROLL_HISTORY_PATH,
  PAYROLL_PAYOUT_STATUS,
  PAYROLL_TAB,
  isPayrollHistoryPath,
  payrollHistoryDetailPath,
  type PayrollChartRange,
  type PayrollDrawerMode,
} from "./config";
import { PayrollFormDrawer } from "./components/payroll-form-drawer";
import { PayrollHistoryDetailDrawer } from "./components/history-detail-drawer";
import { PayrollRunsCard } from "./components/payroll-runs";
import { RecentPayoutsCard } from "./components/recent-payouts";
import { StatsCard } from "./components/stats";
import { TotalPayrollChart } from "./components/total-payroll";
import { type PayrollNextRun, type PayrollRecipientRow } from "@/types/payroll";
import {
  mapPayrollChartSeries,
  payrollHistoryRunStub,
  payrollNextRunToPayDay,
  payrollPayDayToParam,
  payrollUpdateDeleteIds,
  recipientRowsToImportItems,
  recipientRowsToUpdateItems,
} from "./utils";

function queryErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function PayrollView() {
  const { setHeaderExtra } = useOutletContext<PayLayoutOutletContext>();
  const { pathname } = useLocation();
  const { executionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const organizationId = useAuthStore((state) => state.user?.organization?.id ?? null);
  const nextQuery = usePayrollNextQuery();
  const historyQuery = usePayrollHistoryInfiniteQuery();
  const current = usePayrollCurrentStatsQuery();
  const importMutation = usePayrollImportMutation();
  const updateMutation = usePayrollUpdateMutation();
  const historyExportMutation = usePayrollHistoryExportMutation();
  const tab = isPayrollHistoryPath(pathname) ? PAYROLL_TAB.History : PAYROLL_TAB.Next;
  const [chartRange, setChartRange] = useState<PayrollChartRange>(
    PAYROLL_CHART_RANGE.Month
  );
  const totalPayout = usePayrollTotalPayoutQuery(chartRange);
  const recent = usePayrollRecentPayoutsInfiniteQuery();
  const [netPayById, setNetPayById] = useState<Record<string, string>>({});
  const [drawerMode, setDrawerMode] = useState<PayrollDrawerMode | null>(null);
  const [drawerSeed, setDrawerSeed] = useState(0);
  const [importRows, setImportRows] = useState<PayrollRecipientRow[] | null>(null);
  const [editOriginalRows, setEditOriginalRows] = useState<PayrollRecipientRow[] | null>(null);
  const [nextPayrollOverride, setNextPayrollOverride] = useState<PayrollNextRun | null>(null);
  const [payingPayable, setPayingPayable] = useState<PayableKey | null>(null);
  const drawerSaving = importMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    setHeaderExtra(null);
    return () => setHeaderExtra(null);
  }, [setHeaderExtra]);

  const nextPayroll = nextPayrollOverride ?? nextQuery.data ?? null;
  const initialNetPay = useMemo(() => {
    const next: Record<string, string> = {};
    for (const row of nextPayroll?.rows ?? []) {
      next[row.id] = row.netPay;
    }
    return next;
  }, [nextPayroll]);

  const resolvedNetPay = { ...initialNetPay, ...netPayById };
  const chartSeries = useMemo(
    () => mapPayrollChartSeries(totalPayout.data ?? [], chartRange),
    [chartRange, totalPayout.data]
  );
  const recentItems = useMemo(
    () => recent.data?.pages.flat() ?? [],
    [recent.data]
  );
  const historyItems = useMemo(
    () => historyQuery.data?.pages.flatMap((page) => page.list) ?? [],
    [historyQuery.data]
  );
  const historyDetailRun = useMemo(() => {
    if (!executionId) return null;
    return historyItems.find((row) => row.id === executionId) ?? payrollHistoryRunStub(executionId);
  }, [executionId, historyItems]);
  const failedRecentCount = recentItems.filter(
    (item) => item.status === PAYROLL_PAYOUT_STATUS.Failed
  ).length;

  function openAddDrawer(rows?: PayrollRecipientRow[]) {
    setImportRows(rows && rows.length > 0 ? rows : null);
    setDrawerSeed((seed) => seed + 1);
    setDrawerMode(PAYROLL_DRAWER_MODE.Add);
  }

  async function handleDrawerSave(run: PayrollNextRun) {
    if (organizationId == null) {
      toast.fail({ title: "Organization is missing" });
      return;
    }
    try {
      const schedule = payrollPayDayToParam(payrollNextRunToPayDay(run));
      if (drawerMode === PAYROLL_DRAWER_MODE.Edit) {
        const deleteIds = payrollUpdateDeleteIds(
          editOriginalRows ?? nextPayroll?.rows ?? [],
          run.rows,
        );
        await updateMutation.mutateAsync({
          organizationId,
          payrollDayType: schedule.payrollDayType,
          ...(schedule.payrollDay != null ? { payrollDay: schedule.payrollDay } : {}),
          items: recipientRowsToUpdateItems(run.rows),
          ...(deleteIds.length > 0 ? { deleteIds } : {}),
        });
        toast.success({ title: "Payroll saved" });
      } else {
        const result = await importMutation.mutateAsync({
          organizationId,
          payrollDayType: schedule.payrollDayType,
          ...(schedule.payrollDay != null ? { payrollDay: schedule.payrollDay } : {}),
          items: recipientRowsToImportItems(run.rows),
        });
        toast.success({
          title: result.count > 0 ? `Saved ${result.count} recipients` : "Payroll saved",
        });
      }
      setNextPayrollOverride(null);
      setNetPayById({});
      setImportRows(null);
      setEditOriginalRows(null);
      setDrawerMode(null);
    } catch (error) {
      toast.fail({
        title: queryErrorMessage(error, "Could not save payroll"),
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
        title: queryErrorMessage(error, "Could not export payroll history"),
      });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <StatsCard
        loading={current.isLoading}
        error={
          current.isError
            ? queryErrorMessage(current.error, "Failed to load payroll stats")
            : null
        }
        totalThisMonth={current.data?.totalPayout ?? "0"}
        totalChangePercent={current.data?.totalPayoutChange ?? null}
        recipients={current.data?.payments ?? 0}
        recipientsChangePercent={current.data?.paymentsChange ?? null}
        averageSalary={current.data?.averageSalary ?? "0"}
        maximumSalary={current.data?.maxSalary ?? "0"}
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,452px)]">
        <TotalPayrollChart
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
                  "Failed to load payroll chart"
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
          onOpenHistory={() => navigate(PAYROLL_HISTORY_PATH)}
        />
      </div>
      <PayrollRunsCard
        tab={tab}
        nextPayroll={nextPayroll}
        history={historyItems}
        netPayById={resolvedNetPay}
        onNetPayChange={(id, value) => {
          setNetPayById((currentPay) => ({ ...currentPay, [id]: value }));
        }}
        onExport={handleExport}
        exporting={historyExportMutation.isPending}
        onAddPayroll={() => openAddDrawer()}
        onEditPayroll={() => {
          setEditOriginalRows(nextPayroll?.rows ?? []);
          setDrawerMode(PAYROLL_DRAWER_MODE.Edit);
        }}
        onImported={openAddDrawer}
        nextLoading={nextQuery.isLoading}
        historyLoading={historyQuery.isLoading}
        historyError={
          historyQuery.isError
            ? queryErrorMessage(historyQuery.error, "Failed to load payroll history")
            : null
        }
        historyLoadingMore={historyQuery.isFetchingNextPage}
        historyHasMore={Boolean(historyQuery.hasNextPage)}
        onHistoryLoadMore={() => {
          if (!historyQuery.hasNextPage || historyQuery.isFetchingNextPage) return;
          void historyQuery.fetchNextPage();
        }}
        onViewHistoryDetails={(run) => {
          navigate(payrollHistoryDetailPath(run.id));
        }}
        onPayNow={() => {
          if (!nextPayroll?.payable) return;
          const payDate = nextPayroll.payDate.trim();
          if (!payDate) {
            toast.fail({ title: "Next pay date is missing" });
            return;
          }
          setPayingPayable({ type: PAYABLE_TYPE.Payroll, periodMonth: payDate });
        }}
      />
      <PaymentByFormDialog
        open={Boolean(payingPayable)}
        payable={payingPayable}
        onClose={() => setPayingPayable(null)}
      />
      <PayrollHistoryDetailDrawer
        open={historyDetailRun !== null}
        run={historyDetailRun}
        onClose={() => navigate(PAYROLL_HISTORY_PATH)}
      />
      <PayrollFormDrawer
        key={`${drawerMode ?? "closed"}-${drawerSeed}`}
        open={drawerMode !== null}
        mode={drawerMode ?? PAYROLL_DRAWER_MODE.Add}
        saving={drawerSaving}
        initialPayDay={
          drawerMode === PAYROLL_DRAWER_MODE.Edit
            ? payrollNextRunToPayDay(nextPayroll)
            : undefined
        }
        initialRows={
          drawerMode === PAYROLL_DRAWER_MODE.Edit
            ? nextPayroll?.rows
            : importRows ?? undefined
        }
        onClose={() => {
          if (drawerSaving) return;
          setDrawerMode(null);
          setImportRows(null);
          setEditOriginalRows(null);
        }}
        onSave={handleDrawerSave}
      />
    </div>
  );
}
