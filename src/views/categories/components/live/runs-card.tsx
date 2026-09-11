import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { IconLoading } from "@/components/icons/loading";
import { IconPlus } from "@/components/icons/plus";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import { Card } from "@/components/ui/card/Card";
import { cn } from "@/lib/utils";
import type { OperationDraftRow, OperationOpenList } from "@/types/operation";
import type { Payable } from "@/types/payable";
import { ExpenseImportCsvButton } from "@/views/expense/components/expense-runs/ExpenseImportCsvButton";
import { IMPORT_CSV_TEMPLATE } from "@/views/expense/config";
import { DownloadCsvTemplateButton } from "@/views/pay/components/import-csv/DownloadCsvTemplateButton";
import { categoryHistoryPath, categoryPath, operationImportCsvFilename } from "../../config";
import { OPERATION_TAB, type OperationTab } from "../../live-config";
import { OperationHistoryPanel } from "./history-panel";
import { OperationOpenPanel } from "./open-panel";

function TabLink(props: { to: string; children: ReactNode }) {
  const { to, children } = props;
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
          {isActive ? (
            <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-[#06f]" />
          ) : null}
        </>
      )}
    </NavLink>
  );
}

export function OperationRunsCard(props: {
  category: string;
  tab: OperationTab;
  open: OperationOpenList;
  openLoading?: boolean;
  openError?: string | null;
  onPayNow: (form: Payable) => void;
  onAdd: () => void;
  onImported: (rows: OperationDraftRow[]) => void;
  importBusy?: boolean;
}) {
  const {
    category,
    tab,
    open,
    openLoading = false,
    openError = null,
    onPayNow,
    onAdd,
    onImported,
    importBusy = false,
  } = props;
  const isPaymentsTab = tab === OPERATION_TAB.Payments;
  const isHistoryTab = tab === OPERATION_TAB.History;
  const tabLoading = isPaymentsTab ? openLoading : false;
  const tabError = isPaymentsTab ? openError : null;
  const showToolbar =
    !tabLoading &&
    !tabError &&
    ((isPaymentsTab && open.batches.length > 0) || isHistoryTab);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-8">
          <TabLink to={categoryPath(category)}>Payments</TabLink>
          <TabLink to={categoryHistoryPath(category)}>Payout History</TabLink>
        </div>
        {showToolbar ? (
          <div className="flex items-center gap-2 pb-1">
            <DownloadCsvTemplateButton
              content={IMPORT_CSV_TEMPLATE}
              filename={operationImportCsvFilename(category)}
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
              onClick={onAdd}
            >
              <IconPlus className="size-3 shrink-0" />
              Add Payment
            </Button>
          </div>
        ) : null}
      </div>
      <Card className="mt-3 px-5 py-6 sm:px-8">
        {isPaymentsTab ? (
          openLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <IconLoading className="size-5 animate-spin text-[#909090]" />
            </div>
          ) : openError ? (
            <p className="font-montserrat text-sm text-danger">{openError}</p>
          ) : (
            <OperationOpenPanel
              list={open}
              category={category}
              onPayNow={onPayNow}
              onAdd={onAdd}
              onImported={onImported}
              busy={importBusy}
            />
          )
        ) : (
          <OperationHistoryPanel category={category} />
        )}
      </Card>
    </div>
  );
}
