import { Card } from "@/components/ui/card/Card";
import { cn } from "@/lib/utils";
import type {
  ExpenseHistoryRow,
  ExpenseOpenList,
} from "@/mocks/expense";
import { EXPENSE_TAB, type ExpenseTab } from "../../config";
import { HistoryPanel } from "./HistoryPanel";
import { OpenPanel } from "./OpenPanel";

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
        active ? "font-semibold" : "font-normal",
      )}
    >
      {children}
      {active ? (
        <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-[#06f]" />
      ) : null}
    </button>
  );
}

export function ExpenseRunsCard(props: {
  tab: ExpenseTab;
  onTabChange: (tab: ExpenseTab) => void;
  open: ExpenseOpenList;
  history: ExpenseHistoryRow[];
  onPayNow: (formId: string) => void;
}) {
  const { tab, onTabChange, open, history, onPayNow } = props;

  return (
    <div>
      <div className="flex items-end gap-8">
        <TabButton
          active={tab === EXPENSE_TAB.Open}
          onClick={() => onTabChange(EXPENSE_TAB.Open)}
        >
          Open expense
        </TabButton>
        <TabButton
          active={tab === EXPENSE_TAB.History}
          onClick={() => onTabChange(EXPENSE_TAB.History)}
        >
          Expense History
        </TabButton>
      </div>
      <Card className="mt-3 px-5 py-6 sm:px-8">
        {tab === EXPENSE_TAB.Open ? (
          <OpenPanel list={open} onPayNow={onPayNow} />
        ) : (
          <HistoryPanel items={history} />
        )}
      </Card>
    </div>
  );
}
