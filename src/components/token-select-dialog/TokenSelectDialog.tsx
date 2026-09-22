import { useEffect, useMemo, useState } from "react";
import { Icon2Right } from "@/components/icons/to-right";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { useEnsureTokenBalances } from "@/hooks/use-token-balances";
import { getRuntimeChains, getChainByBlockchain } from "@/config/chains";
import type { ChainOwners } from "@/wallet";
import { isNativeToken, useIntentsTokensStore, type IntentsToken } from "@/stores/intents-tokens";
import { useTokenBalancesStore } from "@/stores/token-balances";
import { useTokenSelectPrefsStore } from "@/stores/token-select-prefs";
import type { WalletChainKind } from "@/utils";
import { ChainPane } from "./chain-pane";
import { ALL_CHAIN_FILTER, NETWORK_CHIP_COUNT, TOKEN_BALANCE_POLL_MS } from "./config";
import { TokenPane } from "./token-pane";
import {
  chainHasBalance,
  initialChainFilter,
  isBlockchainDisabled,
  isChainKindLocked,
  matchesChainFilter,
  overflowNetworkCount,
  sortTokensForSelect,
  tokenBalanceUsd,
  tokenMatchesSearch,
  visibleNetworkChips,
} from "./utils";

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
  title = "Select Pay Token",
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
  const lastAssetId = useTokenSelectPrefsStore((s) => s.lastAssetId);
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

  const availableChains = useMemo(() => {
    const codes = new Set(scopedTokens.map((token) => token.blockchain));
    return getRuntimeChains().filter((chain) => codes.has(chain.blockchain));
  }, [scopedTokens]);

  const chips = useMemo(
    () => visibleNetworkChips(
      availableChains,
      recentBlockchains,
      NETWORK_CHIP_COUNT,
      chainFilter === ALL_CHAIN_FILTER ? null : chainFilter,
    ),
    [availableChains, recentBlockchains, chainFilter],
  );

  const overflowCount = overflowNetworkCount(availableChains.length, chips.length);

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

  const filteredTokens = useMemo(() => {
    const matched = scopedTokens.filter((token) => (
      matchesChainFilter(token, chainFilter) && tokenMatchesSearch(token, search)
    ));
    return sortTokensForSelect(matched, {
      lastAssetId,
      showBalances,
      getBalanceUsd: (token) => tokenBalanceUsd(token, getBalance(ownerForToken(owners, token), token.assetId)?.formatted),
    });
  }, [scopedTokens, chainFilter, search, lastAssetId, showBalances, owners, getBalance, balanceEntries]);

  const walletKind = chainFilter === ALL_CHAIN_FILTER
    ? null
    : getChainByBlockchain(chainFilter)?.chainKind ?? null;

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

  function tokenBalance(token: IntentsToken) {
    return getBalance(ownerForToken(owners, token), token.assetId)?.formatted;
  }

  function tokenBalanceLoading(token: IntentsToken) {
    const owner = ownerForToken(owners, token);
    if (!owner) return false;
    const entry = getBalance(owner, token.assetId);
    return entry?.formatted == null && (!entry || entry.status === "loading");
  }

  function handleBack() {
    if (view === "network") {
      setView("token");
      return;
    }
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={(
        <span className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Back"
            onClick={handleBack}
            className="cursor-pointer text-black"
          >
            <Icon2Right className="size-3 rotate-180" />
          </button>
          {view === "network" ? "Select Network" : title}
        </span>
      )}
      titleClassName="text-base font-medium"
      cardClassName="w-full md:w-[454px] max-h-[90vh]"
    >
      {view === "network" ? (
        <ChainPane
          chainFilter={chainFilter}
          onSelectFilter={handleSelectFilter}
          tokens={scopedTokens}
          lockChainKind={lockChainKind}
          disabledBlockchains={disabledBlockchains}
          disabledReason={disabledReason}
          fundedBlockchains={fundedBlockchains}
        />
      ) : (
        <TokenPane
          search={search}
          onSearchChange={setSearch}
          tokens={filteredTokens}
          selectedAssetId={selectedAssetId}
          recentlyUsedAssetId={lastAssetId}
          loading={loading}
          showBalances={showBalances}
          getBalance={tokenBalance}
          isBalanceLoading={tokenBalanceLoading}
          onSelectToken={handleSelectToken}
          isTokenDisabled={(token) => (
            isBlockchainDisabled(token.blockchain, disabledBlockchains)
            || isChainKindLocked(token.chain.chainKind, lockChainKind)
          )}
          chainFilter={chainFilter}
          walletKind={walletKind}
          chips={chips}
          overflowCount={overflowCount}
          fundedBlockchains={fundedBlockchains}
          lockChainKind={lockChainKind}
          disabledBlockchains={disabledBlockchains}
          disabledReason={disabledReason}
          onSelectFilter={handleSelectFilter}
          onOpenNetworks={() => setView("network")}
        />
      )}
    </Dialog>
  );
}

export default TokenSelectDialog;
