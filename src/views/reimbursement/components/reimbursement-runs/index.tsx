import { Card } from "@/components/ui/card/Card";
import { cn } from "@/lib/utils";
import type {
  ReimbursementHistoryRow,
  ReimbursementOpenList,
} from "@/mocks/reimbursement";
import { REIMBURSEMENT_TAB, type ReimbursementTab } from "../../config";
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

export function ReimbursementRunsCard(props: {
  tab: ReimbursementTab;
  onTabChange: (tab: ReimbursementTab) => void;
  open: ReimbursementOpenList;
  history: ReimbursementHistoryRow[];
}) {
  const { tab, onTabChange, open, history } = props;

  return (
    <div>
      <div className="flex items-end gap-8">
        <TabButton
          active={tab === REIMBURSEMENT_TAB.Open}
          onClick={() => onTabChange(REIMBURSEMENT_TAB.Open)}
        >
          Open reimbursement
        </TabButton>
        <TabButton
          active={tab === REIMBURSEMENT_TAB.History}
          onClick={() => onTabChange(REIMBURSEMENT_TAB.History)}
        >
          Reimbursement History
        </TabButton>
      </div>
      <Card className="mt-3 px-5 py-6 sm:px-8">
        {tab === REIMBURSEMENT_TAB.Open ? (
          <OpenPanel list={open} />
        ) : (
          <HistoryPanel items={history} />
        )}
      </Card>
    </div>
  );
}
