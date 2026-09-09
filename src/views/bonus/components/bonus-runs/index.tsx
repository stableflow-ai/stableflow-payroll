import { NavLink } from "react-router-dom";
import { IconExportLink } from "@/components/icons/link";
import { IconLoading } from "@/components/icons/loading";
import { IconPlus } from "@/components/icons/plus";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import { Card } from "@/components/ui/card/Card";
import { cn } from "@/lib/utils";
import type { BonusHistoryItem, BonusPendingList, BonusPendingRow } from "@/types/bonus";
import type { PayableKey } from "@/types/payable";
import {
  BONUS_HISTORY_PATH,
  BONUS_PATH,
  BONUS_TAB,
  type BonusTab,
} from "../../config";
import { BonusImportCsvButton } from "./BonusImportCsvButton";
import { CreateBonusEmpty } from "./CreateBonusEmpty";
import { HistoryPanel } from "./HistoryPanel";
import { PendingBonusPanel } from "./PendingBonusPanel";

function TabLink(props: {
  to: string;
  children: string;
}) {
  const { to, children } = props;
  return (
    <NavLink
      to={to}
      end
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

export function BonusRunsCard(props: {
  tab: BonusTab;
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
  const showPendingToolbar =
    isPendingTab && !tabLoading && !tabError && hasPending;
  const showExport =
    !isPendingTab && !tabLoading && !tabError && history.length > 0 && Boolean(onExport);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-8">
          <TabLink to={BONUS_PATH}>Bonuses to be paid</TabLink>
          <TabLink to={BONUS_HISTORY_PATH}>Bonus History</TabLink>
        </div>
        {showPendingToolbar ? (
          <div className="flex items-center gap-2 pb-1">
            <BonusImportCsvButton
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
              onClick={onAddBonus}
            >
              <IconPlus className="size-3 shrink-0" />
              Add Bonus
            </Button>
          </div>
        ) : showExport ? (
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
