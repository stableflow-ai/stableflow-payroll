import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { IconPlus } from "@stableflow/pay-ui/icons/plus";
import { Button } from "@stableflow/pay-ui/button";
import { BUTTON_VARIANT } from "@stableflow/pay-ui/button";
import { Card } from "@stableflow/pay-ui/card";
import { useExpenseOpenRequestsCountQuery } from "@/hooks/use-expense-api";
import { cn } from "@/lib/utils";
import type { ExpenseDraftRow, ExpenseOpenList } from "@/types/expense";
import type { Payable } from "@/types/payable";
import { CountBadge } from "@/views/pay/components/CountBadge";
import { DownloadCsvTemplateButton } from "@/views/pay/components/import-csv/DownloadCsvTemplateButton";
import { HISTORY_TAB_ANCHOR_ID } from "@/views/pay/history-tab";
import {
  EXPENSE_HISTORY_PATH,
  EXPENSE_PATH,
  EXPENSE_REQUESTS_PATH,
  EXPENSE_TAB,
  IMPORT_CSV_TEMPLATE,
  IMPORT_CSV_TEMPLATE_FILENAME,
  type ExpenseTab,
} from "../../config";
import { ExpenseImportCsvButton } from "./ExpenseImportCsvButton";
import { HistoryPanel } from "./HistoryPanel";
import { OpenPanel } from "./OpenPanel";
import { OpenTable } from "./OpenTable";
import { RequestsPanel } from "./RequestsPanel";

function TabLink(props: {
  to: string;
  children: ReactNode;
  count?: number;
}) {
  const { to, children, count = 0 } = props;
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          "relative inline-flex items-center gap-1.5 pb-2.5 font-montserrat text-base text-black",
          isActive ? "font-semibold" : "font-normal",
        )
      }
    >
      {({ isActive }) => (
        <>
          {children}
          <CountBadge count={count} />
          {isActive ? (
            <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-[#06f]" />
          ) : null}
        </>
      )}
    </NavLink>
  );
}

export function ExpenseRunsCard(props: {
  tab: ExpenseTab;
  open: ExpenseOpenList;
  openLoading?: boolean;
  openError?: string | null;
  onPayNow: (form: Payable) => void;
  onAddExpense: () => void;
  onImported: (rows: ExpenseDraftRow[]) => void;
  importBusy?: boolean;
}) {
  const {
    tab,
    open,
    openLoading = false,
    openError = null,
    onPayNow,
    onAddExpense,
    onImported,
    importBusy = false,
  } = props;
  const requestCount = useExpenseOpenRequestsCountQuery().data?.count ?? 0;
  const isOpenTab = tab === EXPENSE_TAB.Open;
  const isRequestsTab = tab === EXPENSE_TAB.Requests;
  const isHistoryTab = tab === EXPENSE_TAB.History;
  const tabLoading = isOpenTab ? openLoading : false;
  const tabError = isOpenTab ? openError : null;
  const showToolbar =
    !tabLoading &&
    !tabError &&
    ((isOpenTab && open.batches.length > 0) || isHistoryTab);

  return (
    <div>
      <div id={HISTORY_TAB_ANCHOR_ID} className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-8">
          <TabLink to={EXPENSE_PATH}>Open Expense</TabLink>
          <TabLink to={EXPENSE_REQUESTS_PATH} count={requestCount}>
            Request Payments
          </TabLink>
          <TabLink to={EXPENSE_HISTORY_PATH}>Expense History</TabLink>
        </div>
        {showToolbar ? (
          <div className="flex items-center gap-2 pb-1">
            <DownloadCsvTemplateButton
              content={IMPORT_CSV_TEMPLATE}
              filename={IMPORT_CSV_TEMPLATE_FILENAME}
              disabled={importBusy}
            />
            <ExpenseImportCsvButton
              onImported={onImported}
              busy={importBusy}
              variant={BUTTON_VARIANT.Normal}
              fullWidth={false}
              menuAlign="end"
              className="h-9 rounded-[10px] border-black/10 px-4 text-sm text-black"
            />
            <Button
              variant={BUTTON_VARIANT.Normal}
              className="h-9 rounded-[10px] border-black/10 px-4 text-sm text-black"
              disabled={importBusy}
              onClick={onAddExpense}
            >
              <IconPlus className="size-3 shrink-0" />
              Add Expense
            </Button>
          </div>
        ) : null}
      </div>
      <Card className="mt-3 px-5 py-6 sm:px-8">
        {isOpenTab ? (
          openLoading ? (
            <OpenTable batches={[]} onPayNow={onPayNow} loading />
          ) : openError ? (
            <p className="font-montserrat text-sm text-danger">{openError}</p>
          ) : (
            <OpenPanel
              list={open}
              onPayNow={onPayNow}
              onAddExpense={onAddExpense}
              onImported={onImported}
              busy={importBusy}
            />
          )
        ) : isRequestsTab ? (
          <RequestsPanel onPayNow={onPayNow} />
        ) : (
          <HistoryPanel />
        )}
      </Card>
    </div>
  );
}
