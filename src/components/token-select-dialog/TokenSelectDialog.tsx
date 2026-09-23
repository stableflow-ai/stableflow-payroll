import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { SearchInput } from "@/components/ui/search-input/SearchInput";
import { useEnsureTokenBalances } from "@/hooks/use-token-balances";
import { getRuntimeChains, getChainByBlockchain } from "@/config/chains";
import type { ChainOwners } from "@/wallet";
import { isNativeToken, useIntentsTokensStore, type IntentsToken } from "@/stores/intents-tokens";
import { useTokenBalancesStore } from "@/stores/token-balances";
import { useTokenSelectPrefsStore } from "@/stores/token-select-prefs";
import type { WalletChainKind } from "@/utils";
import { ChainPane } from "./chain-pane";
import { ALL_CHAIN_FILTER, TOKEN_BALANCE_POLL_MS } from "./config";
import { NetworkRail } from "./network-rail";
import { TokenPane, type TokenListSection } from "./token-pane";
import {
  chainHasBalance,
  initialChainFilter,
  isBlockchainDisabled,
  isChainKindLocked,
  matchesChainFilter,
  positiveBalanceTokens,
  recentTokensInOrder,
  sortChainsForSidebar,
  sortTokensByBalance,
  sortTokensBySymbol,
  tokenBalanceUsd,
  tokenMatchesSearch,
} from "./utils";

const SEARCH_INPUT_CLASS = "h-[36px] rounded-[18px] border-[#e3e3e3] bg-[#f6f6f6] text-sm placeholder:text-black/30";

export interface TokenSelectSelection {
  token: IntentsToken;
}

export interface TokenSelectDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  selectedAssetId?: string | null;
  showBalances?: boolean;
  balanceOwners?: ChainOwners;
  allowedBlockchains?: string[] | null;
  lockChainKind?: WalletChainKind | null;
  rememberRecentToken?: boolean;
  excludeNative?: boolean;
  disabledBlockchains?: string[] | null;
  disabledReason?: string;
  requireSupport?: "payment" | "receive";
  onSelect: (selection: TokenSelectSelection) => void;
}

function ownerForToken(owners: ChainOwners | null | undefined, token: IntentsToken): string | null {
  return owners?.[token.chain.chainKind] ?? null;
}

function hasAnyOwner(owners: ChainOwners | null | undefined): boolean {
  return Boolean(owners?.evm || owners?.near || owners?.solana || owners?.tron || owners?.zec);
}

export function TokenSelectDialog({
  open,
  onClose,
  title = "Select Token",
  selectedAssetId,
  showBalances = false,
  balanceOwners = {},
  allowedBlockchains = null,
  lockChainKind = null,
  rememberRecentToken = false,
  excludeNative = false,
  disabledBlockchains = null,
  disabledReason,
  requireSupport,
  onSelect,
}: TokenSelectDialogProps) {
  const owners = showBalances ? balanceOwners : {};
  const tokens = useIntentsTokensStore((s) => s.tokens);
  const loading = useIntentsTokensStore((s) => s.loading);
  const getBalance = useTokenBalancesStore((s) => s.getBalance);
  const balanceEntries = useTokenBalancesStore((s) => s.balances);
  const recentAssetIds = useTokenSelectPrefsStore((s) => s.recentAssetIds);
  const recentBlockchains = useTokenSelectPrefsStore((s) => s.recentBlockchains);
  const setLastToken = useTokenSelectPrefsStore((s) => s.setLastToken);
  const setLastBlockchain = useTokenSelectPrefsStore((s) => s.setLastBlockchain);
  const [search, setSearch] = useState("");
  const [chainFilter, setChainFilter] = useState(ALL_CHAIN_FILTER);
  const [view, setView] = useState<"token" | "network">("token");

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setView("token");
    setChainFilter(initialChainFilter(
      lockChainKind,
      useTokenSelectPrefsStore.getState().recentBlockchains,
    ));
  }, [open, lockChainKind]);

  const allowed = useMemo(() => {
    if (!allowedBlockchains || allowedBlockchains.length === 0) return null;
    return new Set(allowedBlockchains.map((code) => code.toLowerCase()));
  }, [allowedBlockchains]);

  const scopedTokens = useMemo(() => {
    return tokens.filter((token) => {
      if (allowed && !allowed.has(token.blockchain.toLowerCase())) return false;
      if (excludeNative && isNativeToken(token)) return false;
      if (requireSupport === "payment" && !token.supportPayment) return false;
      if (requireSupport === "receive" && !token.supportReceive) return false;
      return true;
    });
  }, [tokens, allowed, excludeNative, requireSupport]);

  useEnsureTokenBalances({
    owners,
    tokens: scopedTokens,
    enabled: showBalances && open && hasAnyOwner(owners) && scopedTokens.length > 0,
    pollMs: TOKEN_BALANCE_POLL_MS,
  });

  function balanceOf(token: IntentsToken) {
    return getBalance(ownerForToken(owners, token), token.assetId)?.formatted;
  }

  function usdOf(token: IntentsToken) {
    if (!showBalances) return -1;
    return tokenBalanceUsd(token, balanceOf(token));
  }

  function loadingOf(token: IntentsToken) {
    if (!showBalances) return false;
    const owner = ownerForToken(owners, token);
    if (!owner) return false;
    const entry = getBalance(owner, token.assetId);
    return entry?.formatted == null && (!entry || entry.status === "loading");
  }

  const availableChains = useMemo(() => {
    const codes = new Set(scopedTokens.map((token) => token.blockchain));
    return getRuntimeChains().filter((chain) => codes.has(chain.blockchain));
  }, [scopedTokens]);

  const sortedChains = useMemo(
    () => sortChainsForSidebar(availableChains, scopedTokens, {
      showBalances,
      getBalanceUsd: (token) => tokenBalanceUsd(token, getBalance(ownerForToken(owners, token), token.assetId)?.formatted),
    }),
    [availableChains, scopedTokens, showBalances, owners, getBalance, balanceEntries],
  );

  const fundedBlockchains = useMemo(() => {
    const funded = new Set<string>();
    if (!showBalances) return funded;
    for (const chain of availableChains) {
      if (chainHasBalance(chain.blockchain, scopedTokens, (token) => (
        getBalance(ownerForToken(owners, token), token.assetId)?.formatted
      ))) {
        funded.add(chain.blockchain);
      }
    }
    return funded;
  }, [availableChains, getBalance, owners, scopedTokens, showBalances, balanceEntries]);

  const newestAssetId = showBalances ? recentAssetIds[0] ?? null : null;
  const searchingAll = chainFilter === ALL_CHAIN_FILTER && search.trim().length > 0;
  const walletKind = chainFilter === ALL_CHAIN_FILTER
    ? null
    : getChainByBlockchain(chainFilter)?.chainKind ?? null;

  const sections = useMemo((): TokenListSection[] => {
    if (showBalances && chainFilter === ALL_CHAIN_FILTER && searchingAll) {
      const matched = scopedTokens.filter((token) => tokenMatchesSearch(token, search));
      return [{
        id: "search",
        tokens: sortTokensByBalance(matched, usdOf, loadingOf),
        badgeAssetId: newestAssetId,
      }];
    }

    if (showBalances && chainFilter === ALL_CHAIN_FILTER) {
      const next: TokenListSection[] = [];
      const recent = recentTokensInOrder(scopedTokens, recentAssetIds);
      if (recent.length > 0) {
        next.push({
          id: "recent",
          title: "Recently Used",
          tokens: recent,
          badgeAssetId: newestAssetId,
        });
      }
      const yours = positiveBalanceTokens(scopedTokens, usdOf);
      if (yours.length > 0) {
        next.push({ id: "yours", title: "Your Tokens", tokens: yours });
      }
      return next;
    }

    const matched = scopedTokens.filter((token) => (
      matchesChainFilter(token, chainFilter) && tokenMatchesSearch(token, search)
    ));

    if (!showBalances && chainFilter === ALL_CHAIN_FILTER) {
      return [{ id: "all", tokens: sortTokensBySymbol(matched) }];
    }

    const chainName = getChainByBlockchain(chainFilter)?.chainName ?? chainFilter;
    return [{
      id: chainFilter,
      title: chainName,
      walletKind,
      tokens: showBalances ? sortTokensByBalance(matched, usdOf, loadingOf) : sortTokensBySymbol(matched),
      badgeAssetId: showBalances ? newestAssetId : null,
    }];
  }, [
    showBalances,
    chainFilter,
    searchingAll,
    search,
    scopedTokens,
    recentAssetIds,
    newestAssetId,
    walletKind,
    balanceEntries,
    owners,
  ]);

  function handleSelectFilter(filter: string) {
    setChainFilter(filter);
    if (filter !== ALL_CHAIN_FILTER) setLastBlockchain(filter);
    setView("token");
  }

  function handleSelectToken(token: IntentsToken) {
    if (isBlockchainDisabled(token.blockchain, disabledBlockchains)) return;
    if (isChainKindLocked(token.chain.chainKind, lockChainKind)) return;
    if (rememberRecentToken) setLastToken(token.assetId, token.blockchain);
    else setLastBlockchain(token.blockchain);
    onSelect({ token });
    onClose();
  }

  const awaitingBalances = showBalances
    && chainFilter === ALL_CHAIN_FILTER
    && !searchingAll
    && scopedTokens.some((token) => loadingOf(token));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      titleClassName="min-w-0 flex-1 truncate text-base font-medium text-[#606060] md:flex-none"
      closeClassName={view === "token" ? "ml-0" : undefined}
      headerAction={view === "token" ? (
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="search or paste address"
          className="ml-auto hidden w-[215px] shrink-0 md:block"
          inputClassName={SEARCH_INPUT_CLASS}
        />
      ) : null}
      cardClassName="w-full md:w-[474px] max-h-[90vh]"
    >
      <div className="flex h-[min(520px,62vh)] min-h-0 flex-col overflow-hidden md:h-[min(555px,70vh)]">
        {view === "token" ? (
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="search or paste address"
            className="mb-3 shrink-0 md:hidden"
            inputClassName={SEARCH_INPUT_CLASS}
          />
        ) : null}
        <div className="flex min-h-0 flex-1">
          <NetworkRail
            view={view}
            chainFilter={chainFilter}
            chips={sortedChains}
            fundedBlockchains={fundedBlockchains}
            lockChainKind={lockChainKind}
            disabledBlockchains={disabledBlockchains}
            disabledReason={disabledReason}
            onSelectFilter={handleSelectFilter}
            onOpenNetworks={() => setView("network")}
          />
          {view === "network" ? (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col pl-3 md:pl-4">
              <ChainPane
                chains={sortedChains}
                fundedBlockchains={fundedBlockchains}
                onSelectFilter={handleSelectFilter}
                lockChainKind={lockChainKind}
                disabledBlockchains={disabledBlockchains}
                disabledReason={disabledReason}
              />
            </div>
          ) : (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col pl-3 md:pl-4">
              <TokenPane
                search={search}
                onSearchChange={setSearch}
                sections={sections}
                selectedAssetId={selectedAssetId}
                loading={loading || awaitingBalances}
                showBalances={showBalances}
                getBalance={balanceOf}
                isBalanceLoading={loadingOf}
                onSelectToken={handleSelectToken}
                isTokenDisabled={(token) => (
                  isBlockchainDisabled(token.blockchain, disabledBlockchains)
                  || isChainKindLocked(token.chain.chainKind, lockChainKind)
                )}
              />
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

export default TokenSelectDialog;
