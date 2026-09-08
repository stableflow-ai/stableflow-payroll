import { IconPlus } from "@/components/icons/plus";
import { IconExportLink } from "@/components/icons/link";
import { IconLoading } from "@/components/icons/loading";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import { Card } from "@/components/ui/card/Card";
import { cn } from "@/lib/utils";
import type {
  PayrollHistoryRun,
  PayrollNextRun,
  PayrollRecipientRow
} from "@/types/payroll";
import { NavLink } from "react-router-dom";
import { PAYROLL_HISTORY_PATH, PAYROLL_PATH, PAYROLL_TAB, type PayrollTab } from "../../config";
import { CreatePayrollEmpty } from "./CreatePayrollEmpty";
import { HistoryPanel } from "./HistoryPanel";
import { NextPayrollPanel } from "./NextPayrollPanel";

function TabLink(props: {
  to: string;
  end?: boolean;
  children: string;
}) {
  const { to, end = true, children } = props;
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "relative pb-2.5 font-montserrat text-base text-black",
          isActive ? "font-semibold" : "font-normal",
        )
      }
    >
      {({ isActive }) => (
        <>
          {children}
          {isActive ? (
            <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-[#06f]" />
          ) : null}
        </>
      )}
    </NavLink>
  );
}

export function PayrollRunsCard(props: {
  tab: PayrollTab;
  nextPayroll: PayrollNextRun | null;
  history: PayrollHistoryRun[];
  netPayById: Record<string, string>;
  onNetPayChange: (id: string, value: string) => void;
  onExport: () => void;
  exporting?: boolean;
  onAddPayroll: () => void;
  onEditPayroll: () => void;
  onImported: (rows: PayrollRecipientRow[]) => void;
  nextLoading?: boolean;
  historyLoading?: boolean;
  historyError?: string | null;
  historyLoadingMore?: boolean;
  historyHasMore?: boolean;
  onHistoryLoadMore?: () => void;
  onViewHistoryDetails: (run: PayrollHistoryRun) => void;
  onPayNow: () => void;
}) {
  const {
    tab,
    nextPayroll,
    history,
    netPayById,
    onNetPayChange,
    onExport,
    exporting = false,
    onAddPayroll,
    onEditPayroll,
    onImported,
    nextLoading = false,
    historyLoading = false,
    historyError = null,
    historyLoadingMore = false,
    historyHasMore = false,
    onHistoryLoadMore,
    onViewHistoryDetails,
    onPayNow
  } = props;
  const isNextTab = tab === PAYROLL_TAB.Next;
  const tabLoading = isNextTab ? nextLoading : historyLoading;
  const tabError = isNextTab ? null : historyError;
  const showToolbar =
    !tabLoading &&
    !tabError &&
    (isNextTab ? Boolean(nextPayroll) : history.length > 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-8">
          <TabLink to={PAYROLL_PATH}>Next Payroll</TabLink>
          <TabLink to={PAYROLL_HISTORY_PATH} end={false}>
            Payroll History
          </TabLink>
        </div>
        {showToolbar ? (
          <div className="flex items-center gap-2 pb-1">
            {/* {tab === PAYROLL_TAB.History ? (
              <Button
                variant={BUTTON_VARIANT.Normal}
                loading={exporting}
                className="h-9 rounded-[10px] border-black/10 px-4 text-sm text-black"
                onClick={onExport}
              >
                {exporting ? null : (
                  <IconExportLink className="size-3.5 shrink-0" />
                )}
                Export CSV1
              </Button>
            ) : null} */}
            <Button
              variant={BUTTON_VARIANT.Normal}
              className="h-9 rounded-[10px] border-black/10 px-4 text-sm text-black"
              onClick={onAddPayroll}
            >
              <IconPlus className="size-3 shrink-0" />
              Add a new Payroll
            </Button>
          </div>
        ) : null}
      </div>
      <Card className="mt-3 px-5 py-6 sm:px-8">
        {tabLoading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <IconLoading className="size-5 animate-spin text-[#909090]" />
          </div>
        ) : tabError ? (
          <p className="font-montserrat text-sm text-danger">{tabError}</p>
        ) : tab === PAYROLL_TAB.Next ? (
          nextPayroll ? (
            <NextPayrollPanel
              run={nextPayroll}
              netPayById={netPayById}
              onNetPayChange={onNetPayChange}
              onEdit={onEditPayroll}
              onPayNow={onPayNow}
            />
          ) : (
            <CreatePayrollEmpty
              onAddPayroll={onAddPayroll}
              onImported={onImported}
            />
          )
        ) : (
          <HistoryPanel
            items={history}
            loadingMore={historyLoadingMore}
            hasMore={historyHasMore}
            onLoadMore={onHistoryLoadMore}
            onViewDetails={onViewHistoryDetails}
          />
        )}
      </Card>
    </div>
  );
}
