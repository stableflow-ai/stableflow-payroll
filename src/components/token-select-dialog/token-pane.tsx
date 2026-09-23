import { SearchInput } from "@/components/ui/search-input/SearchInput";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { chainLogoUrl } from "@/lib/logo";
import { cn } from "@/lib/utils";
import type { IntentsToken } from "@/stores/intents-tokens";
import { formatAmount, type WalletChainKind } from "@/utils";
import { ChainWalletStatus } from "./chain-wallet-status";
import { tokenBalanceUsd } from "./utils";

const SEARCH_INPUT_CLASS = "h-[36px] rounded-[18px] border-[#e3e3e3] bg-[#f6f6f6] text-sm placeholder:text-black/30";

export type TokenListSection = {
  id: string;
  title?: string | null;
  walletKind?: WalletChainKind | null;
  tokens: IntentsToken[];
  badgeAssetId?: string | null;
};

export type TokenPaneProps = {
  search: string;
  onSearchChange: (value: string) => void;
  showSearch?: boolean;
  sections: TokenListSection[];
  selectedAssetId?: string | null;
  loading: boolean;
  showBalances?: boolean;
  showWalletStatus?: boolean;
  getBalance: (token: IntentsToken) => string | null | undefined;
  isBalanceLoading: (token: IntentsToken) => boolean;
  onSelectToken: (token: IntentsToken) => void;
  isTokenDisabled?: (token: IntentsToken) => boolean;
};

export function TokenPane({
  search,
  onSearchChange,
  showSearch = false,
  sections,
  selectedAssetId,
  loading,
  showBalances = false,
  showWalletStatus = true,
  getBalance,
  isBalanceLoading,
  onSelectToken,
  isTokenDisabled,
}: TokenPaneProps) {
  const visibleSections = sections.filter((section) => section.title || section.tokens.length > 0);
  const hasTokens = sections.some((section) => section.tokens.length > 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {showSearch ? (
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="search or paste address"
          className="mb-3 shrink-0"
          inputClassName={SEARCH_INPUT_CLASS}
        />
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {visibleSections.map((section) => (
          <section key={section.id} className="mb-2">
            {section.title ? (
              <div className="mb-1 flex items-center justify-between gap-2 px-2 md:px-3.5">
                <p className="min-w-0 truncate font-montserrat text-sm font-medium text-[#aaa]">{section.title}</p>
                {showWalletStatus && section.walletKind ? <ChainWalletStatus kind={section.walletKind} /> : null}
              </div>
            ) : null}
            {section.tokens.map((token) => (
              <TokenRow
                key={`${section.id}-${token.assetId}`}
                token={token}
                selected={token.assetId === selectedAssetId}
                recent={token.assetId === section.badgeAssetId}
                showBalances={showBalances}
                formatted={showBalances ? getBalance(token) : null}
                loadingBalance={showBalances && isBalanceLoading(token)}
                disabled={Boolean(isTokenDisabled?.(token))}
                onSelect={() => onSelectToken(token)}
              />
            ))}
          </section>
        ))}
        {loading && !hasTokens ? <TokenListSkeleton /> : null}
        {!loading && !hasTokens ? (
          <p className="px-1 py-4 font-montserrat text-[13px] text-[#606060]">No tokens found</p>
        ) : null}
      </div>
    </div>
  );
}

function TokenListSkeleton() {
  return (
    <div aria-hidden>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-2.5 px-2 py-3 md:px-3.5">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-16" />
          </span>
        </div>
      ))}
    </div>
  );
}

function TokenRow(props: {
  token: IntentsToken;
  selected: boolean;
  recent: boolean;
  showBalances: boolean;
  formatted: string | null | undefined;
  loadingBalance: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const { token, selected, recent, showBalances, formatted, loadingBalance, disabled, onSelect } = props;
  const usd = showBalances && !loadingBalance && formatted != null
    ? tokenBalanceUsd(token, formatted)
    : -1;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-[12px] px-2 py-3 text-left hover:bg-[#F6F6F6] md:px-3.5",
        selected && "bg-[#F6F6F6]",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="relative size-8 shrink-0">
          <img src={token.logo} alt="" className="size-8 rounded-full object-cover" />
          <img
            src={chainLogoUrl(token.blockchain)}
            alt=""
            className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-[4px] border border-white object-cover"
          />
        </span>
        <span className="min-w-0">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-montserrat text-sm font-semibold text-black">{token.symbol}</span>
            {recent ? (
              <span className="shrink-0 rounded-[9px] bg-[#06f]/10 px-1.5 font-montserrat text-[10px] font-medium leading-[18px] text-[#06f]">
                Recently Used
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate font-montserrat text-xs text-[#606060]">{token.chain.chainName}</span>
        </span>
      </span>
      {showBalances ? (
        <span className="shrink-0 text-right">
          {loadingBalance ? (
            <span
              className="inline-block size-3.5 animate-spin rounded-full border-2 border-[#606060] border-r-transparent"
              aria-label="Loading balance"
            />
          ) : formatted != null ? (
            <>
              <span className="block font-montserrat text-sm font-medium text-black">
                {formatAmount(formatted, { prefix: "", maxDecimals: 4 })}
              </span>
              {usd >= 0 ? (
                <span className="block font-montserrat text-xs text-[#606060]">
                  {formatAmount(usd, { prefix: "$", showDust: true })}
                </span>
              ) : null}
            </>
          ) : (
            <span className="font-montserrat text-sm text-[#606060]">—</span>
          )}
        </span>
      ) : null}
    </button>
  );
}

