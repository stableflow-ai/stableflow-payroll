import { useEffect, useMemo, useState } from "react";
import { Icon2Right } from "@/components/icons/to-right";
import { Drawer } from "@/components/ui/drawer/Drawer";
import { DRAWER_SIDE } from "@/components/ui/drawer/config";
import { Overlay } from "@/components/ui/overlay/Overlay";
import { DESKTOP_MEDIA_QUERY } from "@/components/ui/overlay/config";
import { useEnsureTokenBalances } from "@/hooks/use-token-balances";
import { useMediaQuery } from "@/hooks/use-media-query";
import { FIXED_CHAINS } from "@/config/chains";
import type { ChainOwners } from "@/wallet";
import { isNativeToken, useIntentsTokensStore, type IntentsToken } from "@/stores/intents-tokens";
import { useTokenBalancesStore } from "@/stores/token-balances";
import type { WalletChainKind } from "@/utils";
import { ChainPane } from "./chain-pane";
import { EVM_CHAIN_FILTER, TOKEN_BALANCE_POLL_MS } from "./config";
import { TokenPane } from "./token-pane";
import { tokenBalanceUsd } from "./utils";

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
  excludeNative?: boolean;
  onSelect: (selection: TokenSelectSelection) => void;
}

function ownerForToken(owners: ChainOwners | null | undefined, token: IntentsToken): string | null {
  const kind = token.chain.chainKind;
  if (kind !== "evm" && kind !== "near" && kind !== "solana" && kind !== "tron") return null;
  return owners?.[kind] ?? null;
}

function hasAnyOwner(owners: ChainOwners | null | undefined): boolean {
  return Boolean(owners?.evm || owners?.near || owners?.solana || owners?.tron);
}

function defaultChainFilter(
  selected: IntentsToken | undefined,
  lockChainKind: WalletChainKind | null | undefined,
): string {
  if (selected) {
    return selected.chain.chainKind === "evm" ? EVM_CHAIN_FILTER : selected.blockchain;
  }
  if (lockChainKind && lockChainKind !== "evm") {
    const chain = FIXED_CHAINS.find((item) => item.chainKind === lockChainKind);
    return chain?.blockchain ?? EVM_CHAIN_FILTER;
  }
  return EVM_CHAIN_FILTER;
}

export function TokenSelectDialog({
  open,
  onClose,
  title = "Select token",
  selectedAssetId,
  showBalances = false,
  balanceOwners = {},
  allowedBlockchains = null,
  lockChainKind = null,
  excludeNative = false,
  onSelect,
}: TokenSelectDialogProps) {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const owners = showBalances ? balanceOwners : {};
  const ensureFresh = useIntentsTokensStore((s) => s.ensureFresh);
  const tokens = useIntentsTokensStore((s) => s.tokens);
  const loading = useIntentsTokensStore((s) => s.loading);
  const getBalance = useTokenBalancesStore((s) => s.getBalance);
  const balanceEntries = useTokenBalancesStore((s) => s.balances);
  const [search, setSearch] = useState("");
  const [chainFilter, setChainFilter] = useState(EVM_CHAIN_FILTER);
  const [mobileStep, setMobileStep] = useState<"chain" | "token">("chain");

  const selected = useMemo(
    () => tokens.find((token) => token.assetId === selectedAssetId),
    [tokens, selectedAssetId],
  );

  useEffect(() => {
    if (!open) return;
    void ensureFresh();
    setSearch("");
    setMobileStep("chain");
    setChainFilter(defaultChainFilter(selected, lockChainKind));
  }, [open, ensureFresh, selected, lockChainKind]);

  const allowed = useMemo(() => {
    if (!allowedBlockchains || allowedBlockchains.length === 0) return null;
    return new Set(allowedBlockchains.map((code) => code.toLowerCase()));
  }, [allowedBlockchains]);

  const scopedTokens = useMemo(() => {
    return tokens.filter((token) => {
      if (allowed && !allowed.has(token.blockchain.toLowerCase())) return false;
      if (excludeNative && isNativeToken(token)) return false;
      return true;
    });
  }, [tokens, allowed, excludeNative]);

  useEnsureTokenBalances({
    owners,
    tokens: scopedTokens,
    enabled: showBalances && open && hasAnyOwner(owners) && scopedTokens.length > 0,
    pollMs: TOKEN_BALANCE_POLL_MS,
  });

  const filteredTokens = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scopedTokens.filter((token) => {
      if (chainFilter === EVM_CHAIN_FILTER) {
        if (token.chain.chainKind !== "evm") return false;
      } else if (token.blockchain !== chainFilter) {
        return false;
      }
      if (
        q
        && !token.symbol.toLowerCase().includes(q)
        && !token.providerSymbol.toLowerCase().includes(q)
        && !token.chain.chainName.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    }).slice().sort((a, b) => {
      const bySymbol = a.symbol.localeCompare(b.symbol) || a.chain.chainName.localeCompare(b.chain.chainName);
      if (!showBalances) return bySymbol;
      const aUsd = tokenBalanceUsd(a, getBalance(ownerForToken(owners, a), a.assetId)?.formatted);
      const bUsd = tokenBalanceUsd(b, getBalance(ownerForToken(owners, b), b.assetId)?.formatted);
      if (bUsd !== aUsd) return bUsd - aUsd;
      return bySymbol;
    });
  }, [scopedTokens, chainFilter, search, showBalances, owners, getBalance, balanceEntries]);

  function handleSelectFilter(filter: string) {
    setChainFilter(filter);
    if (!isDesktop) setMobileStep("token");
  }

  function handleSelectToken(token: IntentsToken) {
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

  const chainPane = (
    <ChainPane
      chainFilter={chainFilter}
      onSelectFilter={handleSelectFilter}
      tokens={scopedTokens}
      lockChainKind={lockChainKind}
      hideTitle={!isDesktop}
    />
  );

  const tokenPane = (
    <TokenPane
      search={search}
      onSearchChange={setSearch}
      tokens={filteredTokens}
      selectedAssetId={selectedAssetId}
      loading={loading}
      showBalances={showBalances}
      getBalance={tokenBalance}
      isBalanceLoading={tokenBalanceLoading}
      showClose={isDesktop}
      showTitle={isDesktop}
      onClose={onClose}
      onSelectToken={handleSelectToken}
    />
  );

  if (!open) return null;

  if (!isDesktop) {
    return (
      <Drawer
        open={open}
        onClose={onClose}
        side={DRAWER_SIDE.Bottom}
        title={mobileStep === "chain" ? "Select Chain" : title}
        headerAction={mobileStep === "token" ? (
          <button
            type="button"
            aria-label="Back"
            onClick={() => setMobileStep("chain")}
            className="cursor-pointer text-black"
          >
            <Icon2Right className="size-3 rotate-180" />
          </button>
        ) : undefined}
        cardClassName="max-h-[85vh]"
      >
        <div className="min-h-[320px]">
          {mobileStep === "chain" ? chainPane : tokenPane}
        </div>
      </Drawer>
    );
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div className="pointer-events-none relative flex size-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          className="pointer-events-auto relative flex h-[min(682px,90vh)] w-full max-w-[649px] overflow-hidden rounded-[20px] border border-white bg-[#F6F6F6] shadow-[0_0_20px_0_rgba(0,0,0,0.06)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="w-[275px] shrink-0 overflow-y-auto p-5">{chainPane}</div>
          <div className="flex min-w-0 flex-1 flex-col bg-white p-5">{tokenPane}</div>
        </div>
      </div>
    </Overlay>
  );
}

export default TokenSelectDialog;
