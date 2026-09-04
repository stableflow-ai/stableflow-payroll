import { IconPlus } from "@/components/icons/plus";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import { Card } from "@/components/ui/card/Card";
import { cn } from "@/lib/utils";
import type { BonusHistoryItem, BonusPendingList } from "@/mocks/bonus";
import { BONUS_TAB, type BonusTab } from "../../config";
import { CreateBonusEmpty } from "./CreateBonusEmpty";
import { HistoryPanel } from "./HistoryPanel";
import { PendingBonusPanel } from "./PendingBonusPanel";

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

export function BonusRunsCard(props: {
  tab: BonusTab;
  onTabChange: (tab: BonusTab) => void;
  pending: BonusPendingList | null;
  history: BonusHistoryItem[];
  onAddBonus: () => void;
  onEditBonus: () => void;
}) {
  const { tab, onTabChange, pending, history, onAddBonus, onEditBonus } = props;
  const showToolbar = Boolean(pending) || history.length > 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-8">
          <TabButton
            active={tab === BONUS_TAB.ToBePaid}
            onClick={() => onTabChange(BONUS_TAB.ToBePaid)}
          >
            Bonuses to be paid
          </TabButton>
          <TabButton
            active={tab === BONUS_TAB.History}
            onClick={() => onTabChange(BONUS_TAB.History)}
          >
            Bonus History
          </TabButton>
        </div>
        {showToolbar ? (
          <div className="flex items-center gap-2 pb-1">
            <Button
              variant={BUTTON_VARIANT.Normal}
              className="h-9 rounded-[10px] border-black/10 px-4 text-sm text-black"
              onClick={onAddBonus}
            >
              <IconPlus className="size-3 shrink-0" />
              Add a new Bonus
            </Button>
          </div>
        ) : null}
      </div>
      <Card className="mt-3 px-5 py-6 sm:px-8">
        {tab === BONUS_TAB.ToBePaid ? (
          pending ? (
            <PendingBonusPanel list={pending} onEdit={onEditBonus} />
          ) : (
            <CreateBonusEmpty onAddBonus={onAddBonus} />
          )
        ) : (
          <HistoryPanel items={history} />
        )}
      </Card>
    </div>
  );
}
