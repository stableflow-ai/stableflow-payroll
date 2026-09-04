import { IconPlus } from "@/components/icons/plus";
import { IconExportLink } from "@/components/icons/link";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import { Card } from "@/components/ui/card/Card";
import { cn } from "@/lib/utils";
import type { PayrollHistoryRun, PayrollNextRun } from "@/mocks/payroll";
import { PAYROLL_TAB, type PayrollTab } from "../../config";
import { CreatePayrollEmpty } from "./CreatePayrollEmpty";
import { HistoryPanel } from "./HistoryPanel";
import { NextPayrollPanel } from "./NextPayrollPanel";

function TabButton(props: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  const { active, children, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative pb-2.5 font-montserrat text-base text-black",
        active ? "font-semibold" : "font-normal"
      )}
    >
      {children}
      {active ? (
        <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-[#06f]" />
      ) : null}
    </button>
  );
}

export function PayrollRunsCard(props: {
  tab: PayrollTab;
  onTabChange: (tab: PayrollTab) => void;
  nextPayroll: PayrollNextRun | null;
  history: PayrollHistoryRun[];
  netPayById: Record<string, string>;
  onNetPayChange: (id: string, value: string) => void;
  onExport: () => void;
  onAddPayroll: () => void;
  onEditPayroll: () => void;
}) {
  const {
    tab,
    onTabChange,
    nextPayroll,
    history,
    netPayById,
    onNetPayChange,
    onExport,
    onAddPayroll,
    onEditPayroll
  } = props;
  const showToolbar = Boolean(nextPayroll) || history.length > 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-8">
          <TabButton
            active={tab === PAYROLL_TAB.Next}
            onClick={() => onTabChange(PAYROLL_TAB.Next)}
          >
            Next Payroll
          </TabButton>
          <TabButton
            active={tab === PAYROLL_TAB.History}
            onClick={() => onTabChange(PAYROLL_TAB.History)}
          >
            Payroll History
          </TabButton>
        </div>
        {showToolbar ? (
          <div className="flex items-center gap-2 pb-1">
            <Button
              variant={BUTTON_VARIANT.Normal}
              className="h-9 rounded-[10px] border-black/10 px-4 text-sm text-black"
              onClick={onExport}
            >
              <IconExportLink className="size-3.5 shrink-0" />
              Export CSV
            </Button>
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
        {tab === PAYROLL_TAB.Next ? (
          nextPayroll ? (
            <NextPayrollPanel
              run={nextPayroll}
              netPayById={netPayById}
              onNetPayChange={onNetPayChange}
              onEdit={onEditPayroll}
            />
          ) : (
            <CreatePayrollEmpty onAddPayroll={onAddPayroll} />
          )
        ) : (
          <HistoryPanel items={history} />
        )}
      </Card>
    </div>
  );
}
