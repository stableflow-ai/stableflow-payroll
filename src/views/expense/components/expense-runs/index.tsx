import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { IconLoading } from "@/components/icons/loading";
import { IconPlus } from "@/components/icons/plus";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import { Card } from "@/components/ui/card/Card";
import { cn } from "@/lib/utils";
import type { ExpenseDraftRow, ExpenseOpenList } from "@/types/expense";
import type { PayableKey } from "@/types/payable";
import {
  EXPENSE_HISTORY_PATH,
  EXPENSE_PATH,
  EXPENSE_REQUESTS_PATH,
  EXPENSE_TAB,
  type ExpenseTab,
} from "../../config";
import { ExpenseImportCsvButton } from "./ExpenseImportCsvButton";
import { HistoryPanel } from "./HistoryPanel";
import { OpenPanel } from "./OpenPanel";
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
          {count > 0 ? (
            <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-[8px] bg-[#06f] px-0.5 font-montserrat text-[12px] font-medium leading-none text-white">
              {count}
            </span>
          ) : null}
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
  requestCount?: number;
  onPayNow: (payable: PayableKey) => void;
  onAddExpense: () => void;
  onImported: (rows: ExpenseDraftRow[]) => void;
  importBusy?: boolean;
}) {
  const {
    tab,
    open,
    openLoading = false,
    openError = null,
    requestCount = 0,
    onPayNow,
    onAddExpense,
    onImported,
    importBusy = false,
  } = props;
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-8">
          <TabLink to={EXPENSE_PATH}>Open expense</TabLink>
          <TabLink to={EXPENSE_REQUESTS_PATH} count={requestCount}>
            Request Payments
          </TabLink>
          <TabLink to={EXPENSE_HISTORY_PATH}>Expense History</TabLink>
        </div>
        {showToolbar ? (
          <div className="flex items-center gap-2 pb-1">
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
            <div className="flex min-h-[240px] items-center justify-center">
              <IconLoading className="size-5 animate-spin text-[#909090]" />
            </div>
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
