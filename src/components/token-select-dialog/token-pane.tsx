import { SearchInput } from "@/components/ui/search-input/SearchInput";
import { chainLogoUrl } from "@/lib/logo";
import { cn } from "@/lib/utils";
import type { IntentsToken } from "@/stores/intents-tokens";
import { formatAmount, type WalletChainKind } from "@/utils";
import { ChainWalletStatus } from "./chain-wallet-status";
import { ALL_CHAIN_FILTER } from "./config";
import { NetworkChips, type NetworkChipsProps } from "./network-chips";
import { tokenBalanceUsd } from "./utils";

export type TokenPaneProps = {
  search: string;
  onSearchChange: (value: string) => void;
  tokens: IntentsToken[];
  selectedAssetId?: string | null;
  recentlyUsedAssetId?: string | null;
  loading: boolean;
  showBalances?: boolean;
  getBalance: (token: IntentsToken) => string | null | undefined;
  isBalanceLoading: (token: IntentsToken) => boolean;
  onSelectToken: (token: IntentsToken) => void;
  isTokenDisabled?: (token: IntentsToken) => boolean;
  chainFilter: string;
  walletKind?: WalletChainKind | null;
  chips: NetworkChipsProps["chips"];
  overflowCount: number;
  fundedBlockchains: ReadonlySet<string>;
  lockChainKind?: WalletChainKind | null;
  disabledBlockchains?: string[] | null;
  disabledReason?: string;
  onSelectFilter: (filter: string) => void;
  onOpenNetworks: () => void;
};

export function TokenPane({
  search,
  onSearchChange,
  tokens,
  selectedAssetId,
  recentlyUsedAssetId = null,
  loading,
  showBalances = false,
  getBalance,
  isBalanceLoading,
  onSelectToken,
  isTokenDisabled,
  chainFilter,
  walletKind = null,
  chips,
  overflowCount,
  fundedBlockchains,
  lockChainKind = null,
  disabledBlockchains = null,
  disabledReason,
  onSelectFilter,
  onOpenNetworks,
}: TokenPaneProps) {
  return (
    <div className="flex h-[min(520px,70vh)] min-h-0 flex-col">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="search name or paste address"
        className="shrink-0"
        inputClassName="h-[42px] rounded-[6px] border-[#e3e3e3] bg-[#f6f6f6] placeholder:text-black/30"
      />
      <div className="mt-6 flex shrink-0 items-center justify-between gap-2">
        <p className="font-montserrat text-xs font-medium text-black">Select Network</p>
        {chainFilter !== ALL_CHAIN_FILTER && walletKind ? (
          <ChainWalletStatus kind={walletKind} />
        ) : null}
      </div>
      <div className="mt-3 shrink-0">
        <NetworkChips
          chainFilter={chainFilter}
          chips={chips}
          overflowCount={overflowCount}
          fundedBlockchains={fundedBlockchains}
          lockChainKind={lockChainKind}
          disabledBlockchains={disabledBlockchains}
          disabledReason={disabledReason}
          onSelectFilter={onSelectFilter}
          onOpenNetworks={onOpenNetworks}
        />
      </div>
      <p className="mt-6 shrink-0 font-montserrat text-xs font-medium text-black">Token</p>
      <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto">
        {loading && tokens.length === 0 ? (
          <p className="px-1 py-4 font-montserrat text-[13px] text-[#606060]">Loading tokens…</p>
        ) : null}
        {!loading && tokens.length === 0 ? (
          <p className="px-1 py-4 font-montserrat text-[13px] text-[#606060]">No tokens found</p>
        ) : null}
        {tokens.map((token) => {
          const selected = token.assetId === selectedAssetId;
          const recent = token.assetId === recentlyUsedAssetId;
          const formatted = showBalances ? getBalance(token) : null;
          const loadingBalance = showBalances && isBalanceLoading(token);
          const usd = showBalances && !loadingBalance && formatted != null
            ? tokenBalanceUsd(token, formatted)
            : -1;
          const disabled = Boolean(isTokenDisabled?.(token));
          return (
            <button
              key={token.assetId}
              type="button"
              disabled={disabled}
              onClick={() => onSelectToken(token)}
              className={cn(
                "flex w-full items-center justify-between rounded-[12px] px-3.5 py-3 text-left hover:bg-[#F6F6F6]",
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
                  <span className="flex items-center gap-1.5">
                    <span className="font-montserrat text-sm font-semibold text-black">{token.symbol}</span>
                    {recent ? (
                      <span className="rounded-[9px] bg-[#06f]/10 px-1.5 font-montserrat text-[10px] font-medium leading-[18px] text-[#06f]">
                        Recently Used
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block font-montserrat text-xs text-[#606060]">{token.chain.chainName}</span>
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
        })}
      </div>
    </div>
  );
}
