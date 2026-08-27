import { IconClose } from "@/components/icons/close";
import { SearchInput } from "@/components/ui/search-input/SearchInput";
import { chainLogoUrl } from "@/lib/logo";
import { cn } from "@/lib/utils";
import type { IntentsToken } from "@/stores/intents-tokens";
import { formatAmount } from "@/utils";
import { tokenBalanceUsd } from "./utils";

export type TokenPaneProps = {
  search: string;
  onSearchChange: (value: string) => void;
  tokens: IntentsToken[];
  selectedAssetId?: string | null;
  loading: boolean;
  showBalances?: boolean;
  getBalance: (token: IntentsToken) => string | null | undefined;
  isBalanceLoading: (token: IntentsToken) => boolean;
  showClose?: boolean;
  showTitle?: boolean;
  onClose?: () => void;
  onSelectToken: (token: IntentsToken) => void;
};

export function TokenPane({
  search,
  onSearchChange,
  tokens,
  selectedAssetId,
  loading,
  showBalances = false,
  getBalance,
  isBalanceLoading,
  showClose = false,
  showTitle = true,
  onClose,
  onSelectToken,
}: TokenPaneProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {showTitle || showClose ? (
        <div className="mb-4 flex items-center justify-between">
          {showTitle ? (
            <p className="font-montserrat text-base font-medium text-black">Select Token</p>
          ) : <span />}
          {showClose ? (
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="shrink-0 cursor-pointer text-black"
            >
              <IconClose className="size-3.25" />
            </button>
          ) : null}
        </div>
      ) : null}
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search token"
        className="shrink-0"
      />
      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {loading && tokens.length === 0 ? (
          <p className="px-1 py-4 font-montserrat text-[13px] text-[#606060]">Loading tokens…</p>
        ) : null}
        {!loading && tokens.length === 0 ? (
          <p className="px-1 py-4 font-montserrat text-[13px] text-[#606060]">No tokens found</p>
        ) : null}
        {tokens.map((token) => {
          const selected = token.assetId === selectedAssetId;
          const formatted = showBalances ? getBalance(token) : null;
          const loadingBalance = showBalances && isBalanceLoading(token);
          const usd = showBalances && !loadingBalance && formatted != null
            ? tokenBalanceUsd(token, formatted)
            : -1;
          return (
            <button
              key={token.assetId}
              type="button"
              onClick={() => onSelectToken(token)}
              className={cn(
                "flex w-full items-center justify-between rounded-[10px] px-1 py-1.5 text-left hover:bg-[#F6F6F6]",
                selected && "bg-[#F6F6F6]",
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
                  <span className="block font-montserrat text-sm font-medium text-black">{token.symbol}</span>
                  <span className="block font-montserrat text-[10px] text-[#606060]">{token.chain.chainName}</span>
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
                      <span className="block font-montserrat text-sm text-[#606060]">
                        {formatAmount(formatted, { prefix: "", maxDecimals: 4 })}
                      </span>
                      {usd >= 0 ? (
                        <span className="block font-montserrat text-[10px] text-[#909090]">
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
        })}
      </div>
    </div>
  );
}
