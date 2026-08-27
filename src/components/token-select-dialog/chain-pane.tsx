import type { ReactNode } from "react";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { FLOATING_SIDE } from "@/components/ui/overlay/use-floating-position";
import { FIXED_CHAINS, chainLabel, type ChainConfig } from "@/config/chains";
import { chainLogoUrl } from "@/lib/logo";
import { cn } from "@/lib/utils";
import type { IntentsToken } from "@/stores/intents-tokens";
import type { WalletChainKind } from "@/utils";
import { ChainWalletStatus } from "./chain-wallet-status";
import { EVM_CHAIN_FILTER } from "./config";

export type ChainPaneProps = {
  chainFilter: string;
  onSelectFilter: (filter: string) => void;
  tokens: IntentsToken[];
  lockChainKind?: WalletChainKind | null;
  hideTitle?: boolean;
};

function chainKindLabel(kind: WalletChainKind): string {
  return chainLabel(kind);
}

function isLocked(chain: ChainConfig, lockChainKind: WalletChainKind | null | undefined): boolean {
  return Boolean(lockChainKind && chain.chainKind !== lockChainKind);
}

export function ChainPane({
  chainFilter,
  onSelectFilter,
  tokens,
  lockChainKind = null,
  hideTitle = false,
}: ChainPaneProps) {
  const availableCodes = new Set(tokens.map((token) => token.blockchain));
  const evmChains = FIXED_CHAINS.filter(
    (chain) => chain.chainKind === "evm" && availableCodes.has(chain.blockchain),
  );
  const nonEvmChains = FIXED_CHAINS.filter(
    (chain) => chain.chainKind !== "evm" && availableCodes.has(chain.blockchain),
  );
  const evmLocked = Boolean(lockChainKind && lockChainKind !== "evm");
  const previewLogos = evmChains.slice(0, 4);

  function evmRow(disabled: boolean, content: ReactNode) {
    if (!disabled || !lockChainKind) return content;
    return (
      <Tooltip
        side={FLOATING_SIDE.Right}
        content={`Recipient address is on ${chainKindLabel(lockChainKind)}; edit the recipient to change chain`}
      >
        {content}
      </Tooltip>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      {hideTitle ? null : (
        <p className="font-montserrat text-base font-medium text-black">Select Chain</p>
      )}
      {evmChains.length > 0 ? (
        <div className="rounded-[12px] bg-[#F6F6F6] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="grid grid-cols-2 gap-px">
                {previewLogos.map((chain) => (
                  <img
                    key={chain.blockchain}
                    src={chain.logo}
                    alt=""
                    className="size-3 rounded-[3px] object-cover"
                  />
                ))}
              </div>
              <span className="font-montserrat text-sm font-medium text-black">EVM</span>
            </div>
            <ChainWalletStatus kind="evm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {evmRow(
              evmLocked,
              <button
                type="button"
                disabled={evmLocked}
                onClick={() => {
                  if (evmLocked) return;
                  onSelectFilter(EVM_CHAIN_FILTER);
                }}
                className={cn(
                  "h-10 rounded-[8px] bg-white px-2 font-montserrat text-xs font-medium text-black",
                  chainFilter === EVM_CHAIN_FILTER ? "border border-black" : "border border-transparent",
                  evmLocked ? "cursor-not-allowed opacity-40" : "hover:bg-black/5",
                )}
              >
                All
              </button>,
            )}
            {evmChains.map((chain) => {
              const selected = chainFilter === chain.blockchain;
              const locked = isLocked(chain, lockChainKind);
              return (
                <span key={chain.blockchain}>
                  {evmRow(
                    locked,
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => {
                        if (locked) return;
                        onSelectFilter(chain.blockchain);
                      }}
                      className={cn(
                        "flex h-10 w-full items-center gap-1.5 rounded-[8px] bg-white px-2",
                        selected ? "border border-black" : "border border-transparent",
                        locked ? "cursor-not-allowed opacity-40" : "hover:bg-black/5",
                      )}
                    >
                      <img src={chainLogoUrl(chain.blockchain)} alt="" className="size-4 rounded-[3px] object-cover" />
                      <span className="truncate font-montserrat text-xs font-medium text-black">
                        {chain.chainName}
                      </span>
                    </button>,
                  )}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
        {nonEvmChains.map((chain) => {
          const selected = chainFilter === chain.blockchain;
          const locked = isLocked(chain, lockChainKind);
          const kind = chain.chainKind;
          const selectButton = (
            <button
              type="button"
              disabled={locked}
              onClick={() => {
                if (locked) return;
                onSelectFilter(chain.blockchain);
              }}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2.5 text-left",
                locked ? "cursor-not-allowed opacity-40" : "hover:opacity-80",
              )}
            >
              <img src={chain.logo} alt="" className="size-6 rounded-[6px] object-cover" />
              <span className="font-montserrat text-sm font-medium text-black">{chain.chainName}</span>
            </button>
          );
          return (
            <div
              key={chain.blockchain}
              className={cn(
                "flex min-h-[50px] w-full items-center gap-2.5 rounded-[10px] bg-[#F6F6F6] px-3 py-2",
                selected ? "border border-black" : "border border-transparent",
              )}
            >
              {locked && lockChainKind ? (
                <Tooltip
                  side={FLOATING_SIDE.Right}
                  triggerClassName="min-w-0 flex-1"
                  content={`Recipient address is on ${chainKindLabel(lockChainKind)}; edit the recipient to change chain`}
                >
                  {selectButton}
                </Tooltip>
              ) : selectButton}
              {kind === "near" || kind === "solana" || kind === "tron" ? (
                <ChainWalletStatus kind={kind} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
