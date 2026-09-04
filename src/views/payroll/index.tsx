import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { usePayrollOverviewQuery } from "@/hooks/use-payroll-api";
import { IconLoading } from "@/components/icons/loading";
import { Switch } from "@/components/ui/switch/Switch";
import type { PayLayoutOutletContext } from "@/layouts/PayLayout";
import type { PayrollNextRun } from "@/mocks/payroll";
import { PaymentByFormDialog } from "@/views/pay/components/payment-form/PaymentByFormDialog";
import { PayrollRunsCard } from "./components/payroll-runs";
import { RecentPayoutsCard } from "./components/recent-payouts";
import { StatsCard } from "./components/stats";
import { TotalPayrollChart } from "./components/total-payroll";
import { PayrollFormDrawer } from "./components/payroll-form-drawer";
import {
  IMPORT_CSV_TEMPLATE_FILENAME,
  PAYROLL_CHART_RANGE,
  PAYROLL_DRAWER_MODE,
  PAYROLL_MOCK_VARIANT,
  PAYROLL_PAY_NOW_FORM_ID,
  PAYROLL_TAB,
  type PayrollChartRange,
  type PayrollDrawerMode,
  type PayrollMockVariant,
  type PayrollTab
} from "./config";

export function PayrollView() {
  const { setHeaderExtra } = useOutletContext<PayLayoutOutletContext>();
  const [variant, setVariant] = useState<PayrollMockVariant>(
    PAYROLL_MOCK_VARIANT.Filled
  );
  const overview = usePayrollOverviewQuery(variant);
  const [tab, setTab] = useState<PayrollTab>(PAYROLL_TAB.Next);
  const [chartRange, setChartRange] = useState<PayrollChartRange>(
    PAYROLL_CHART_RANGE.Months6
  );
  const [netPayById, setNetPayById] = useState<Record<string, string>>({});
  const [drawerMode, setDrawerMode] = useState<PayrollDrawerMode | null>(null);
  const [nextPayrollOverride, setNextPayrollOverride] = useState<PayrollNextRun | null>(null);
  const [payingFormId, setPayingFormId] = useState<string | null>(null);

  useEffect(() => {
    setHeaderExtra(
      <label className="flex items-center gap-2">
        <span className="font-montserrat text-sm text-[#606060]">Sample data</span>
        <Switch
          checked={variant === PAYROLL_MOCK_VARIANT.Filled}
          onCheckedChange={(checked) => {
            setVariant(
              checked ? PAYROLL_MOCK_VARIANT.Filled : PAYROLL_MOCK_VARIANT.Empty
            );
            setNetPayById({});
            setNextPayrollOverride(null);
            setDrawerMode(null);
            setPayingFormId(null);
          }}
          aria-label="Sample data"
        />
      </label>
    );
    return () => setHeaderExtra(null);
  }, [setHeaderExtra, variant]);

  const data = overview.data;
  const nextPayroll = nextPayrollOverride ?? data?.nextPayroll ?? null;
  const initialNetPay = useMemo(() => {
    const next: Record<string, string> = {};
    for (const row of nextPayroll?.rows ?? []) {
      next[row.id] = row.netPay;
    }
    return next;
  }, [nextPayroll]);

  const resolvedNetPay = { ...initialNetPay, ...netPayById };

  function handleExport() {
    const header = "name,address,token,network,amount,net_pay";
    const rows = (nextPayroll?.rows ?? []).map((row) =>
      [
        row.name,
        row.address,
        row.token,
        row.network,
        row.amount,
        resolvedNetPay[row.id] ?? row.netPay
      ].join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = IMPORT_CSV_TEMPLATE_FILENAME.replace("template", "export");
    link.click();
    URL.revokeObjectURL(url);
  }

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
          : "Failed to load payroll"}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <StatsCard
        totalThisMonth={data.totalThisMonth}
        totalChangePercent={data.totalChangePercent}
        recipients={data.recipients}
        recipientsChangePercent={data.recipientsChangePercent}
        averageSalary={data.averageSalary}
        maximumSalary={data.maximumSalary}
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,452px)]">
        <TotalPayrollChart
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
      <PayrollRunsCard
        tab={tab}
        onTabChange={setTab}
        nextPayroll={nextPayroll}
        history={data.history}
        netPayById={resolvedNetPay}
        onNetPayChange={(id, value) => {
          setNetPayById((current) => ({ ...current, [id]: value }));
        }}
        onExport={handleExport}
        onAddPayroll={() => setDrawerMode(PAYROLL_DRAWER_MODE.Add)}
        onEditPayroll={() => setDrawerMode(PAYROLL_DRAWER_MODE.Edit)}
        onPayNow={() => setPayingFormId(PAYROLL_PAY_NOW_FORM_ID)}
      />
      <PaymentByFormDialog
        open={Boolean(payingFormId)}
        formId={payingFormId}
        onClose={() => setPayingFormId(null)}
      />
      <PayrollFormDrawer
        key={drawerMode ?? "closed"}
        open={drawerMode !== null}
        mode={drawerMode ?? PAYROLL_DRAWER_MODE.Add}
        initialPayDate={
          drawerMode === PAYROLL_DRAWER_MODE.Edit ? nextPayroll?.payDate : undefined
        }
        initialRows={
          drawerMode === PAYROLL_DRAWER_MODE.Edit ? nextPayroll?.rows : undefined
        }
        onClose={() => setDrawerMode(null)}
        onSave={(run) => {
          setNextPayrollOverride(run);
          setNetPayById({});
          setDrawerMode(null);
        }}
      />
    </div>
  );
}
