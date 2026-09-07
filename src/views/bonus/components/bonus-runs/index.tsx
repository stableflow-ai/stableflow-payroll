import { IconExportLink } from "@/components/icons/link";
import { IconLoading } from "@/components/icons/loading";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import { Card } from "@/components/ui/card/Card";
import { cn } from "@/lib/utils";
import type { BonusHistoryItem, BonusPendingList, BonusPendingRow } from "@/types/bonus";
import type { PayableKey } from "@/types/payable";
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
  pendingLoading?: boolean;
  pendingError?: string | null;
  history: BonusHistoryItem[];
  historyLoading?: boolean;
  historyError?: string | null;
  historyLoadingMore?: boolean;
  historyHasMore?: boolean;
  onHistoryLoadMore?: () => void;
  onAddBonus: () => void;
  onImported: (rows: BonusPendingRow[]) => void;
  importBusy?: boolean;
  onPayNow: (payable: PayableKey) => void;
  onExport?: () => void;
  exporting?: boolean;
}) {
  const {
    tab,
    onTabChange,
    pending,
    pendingLoading = false,
    pendingError = null,
    history,
    historyLoading = false,
    historyError = null,
    historyLoadingMore = false,
    historyHasMore = false,
    onHistoryLoadMore,
    onAddBonus,
    onImported,
    importBusy = false,
    onPayNow,
    onExport,
    exporting = false,
  } = props;
  const isPendingTab = tab === BONUS_TAB.ToBePaid;
  const tabLoading = isPendingTab ? pendingLoading : historyLoading;
  const tabError = isPendingTab ? pendingError : historyError;
  const hasPending = Boolean(pending && pending.items.length > 0);
  const showExport =
    !isPendingTab && !tabLoading && !tabError && history.length > 0 && Boolean(onExport);

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
        {showExport ? (
          <div className="flex items-center gap-2 pb-1">
            <Button
              variant={BUTTON_VARIANT.Normal}
              loading={exporting}
              className="h-9 rounded-[10px] border-black/10 px-4 text-sm text-black"
              onClick={onExport}
            >
              {exporting ? null : <IconExportLink className="size-3.5 shrink-0" />}
              Export CSV
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
        ) : isPendingTab ? (
          hasPending && pending ? (
            <PendingBonusPanel
              list={pending}
              onAddBonus={onAddBonus}
              onPayNow={onPayNow}
            />
          ) : (
            <CreateBonusEmpty
              onAddBonus={onAddBonus}
              onImported={onImported}
              busy={importBusy}
            />
          )
        ) : (
          <HistoryPanel
            items={history}
            loadingMore={historyLoadingMore}
            hasMore={historyHasMore}
            onLoadMore={onHistoryLoadMore}
          />
        )}
      </Card>
    </div>
  );
}
