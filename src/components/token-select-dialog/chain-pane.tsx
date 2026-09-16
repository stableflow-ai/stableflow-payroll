import type { ReactNode } from "react";
import { IconCheck } from "@/components/icons/check";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { FLOATING_SIDE } from "@/components/ui/overlay/use-floating-position";
import { FIXED_CHAINS, chainLabel, type ChainConfig } from "@/config/chains";
import { chainLogoUrl } from "@/lib/logo";
import { cn } from "@/lib/utils";
import type { IntentsToken } from "@/stores/intents-tokens";
import type { WalletChainKind } from "@/utils";
import { ChainWalletStatus } from "./chain-wallet-status";
import { isBlockchainDisabled, isChainKindLocked } from "./utils";

export type ChainPaneProps = {
  chainFilter: string;
  onSelectFilter: (filter: string) => void;
  tokens: IntentsToken[];
  lockChainKind?: WalletChainKind | null;
  disabledBlockchains?: string[] | null;
  disabledReason?: string;
  fundedBlockchains: ReadonlySet<string>;
};

function lockReason(lockChainKind: WalletChainKind): string {
  return `Recipient address is on ${chainLabel(lockChainKind)}; edit the recipient to change chain`;
}

export function ChainPane({
  chainFilter,
  onSelectFilter,
  tokens,
  lockChainKind = null,
  disabledBlockchains = null,
  disabledReason,
  fundedBlockchains,
}: ChainPaneProps) {
  const availableCodes = new Set(tokens.map((token) => token.blockchain));
  const evmChains = FIXED_CHAINS.filter(
    (chain) => chain.chainKind === "evm" && availableCodes.has(chain.blockchain),
  );
  const nonEvmChains = FIXED_CHAINS.filter(
    (chain) => chain.chainKind !== "evm" && availableCodes.has(chain.blockchain),
  );

  function wrapDisabled(disabled: boolean, reason: string | undefined, content: ReactNode) {
    if (!disabled || !reason) return content;
    return (
      <Tooltip side={FLOATING_SIDE.Right} triggerClassName="min-w-0 flex-1" content={reason}>
        {content}
      </Tooltip>
    );
  }

  function networkRow(chain: ChainConfig, trailing: ReactNode) {
    const selected = chainFilter === chain.blockchain;
    const locked = isChainKindLocked(chain.chainKind, lockChainKind);
    const chainDisabled = isBlockchainDisabled(chain.blockchain, disabledBlockchains);
    const disabled = locked || chainDisabled;
    const reason = chainDisabled
      ? disabledReason
      : locked && lockChainKind
        ? lockReason(lockChainKind)
        : undefined;
    const row = (
      <div
        className={cn(
          "flex min-h-[66px] w-full items-center gap-3 rounded-[12px] px-3",
          selected ? "bg-[#F6F6F6]" : "hover:bg-[#F6F6F6]",
          disabled && "opacity-40",
        )}
      >
        {wrapDisabled(
          disabled,
          reason,
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              onSelectFilter(chain.blockchain);
            }}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-3 text-left",
              disabled ? "cursor-not-allowed" : "cursor-pointer",
            )}
          >
            <img src={chainLogoUrl(chain.blockchain)} alt="" className="size-8 shrink-0 object-cover" />
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="font-montserrat text-base font-medium text-black">{chain.chainName}</span>
              {fundedBlockchains.has(chain.blockchain) ? (
                <span className="size-2.5 shrink-0 rounded-full bg-[#06f]" />
              ) : null}
            </span>
          </button>,
        )}
        {trailing}
        {selected ? (
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-black text-white">
            <IconCheck className="size-2.5" />
          </span>
        ) : null}
      </div>
    );
    return <div key={chain.blockchain}>{row}</div>;
  }

  return (
    <div className="flex h-[min(520px,70vh)] min-h-0 flex-col overflow-y-auto">
      {evmChains.length > 0 ? (
        <div>
          <div className="flex items-center justify-between gap-2 px-3">
            <p className="font-montserrat text-xs font-medium text-black">EVM Based</p>
            <ChainWalletStatus kind="evm" />
          </div>
          <div className="mt-2 flex flex-col">
            {evmChains.map((chain) => networkRow(chain, null))}
          </div>
        </div>
      ) : null}
      {nonEvmChains.length > 0 ? (
        <div className={evmChains.length > 0 ? "mt-6" : undefined}>
          <p className="px-3 font-montserrat text-xs font-medium text-black">Others</p>
          <div className="mt-2 flex flex-col">
            {nonEvmChains.map((chain) => networkRow(
              chain,
              <ChainWalletStatus kind={chain.chainKind} />,
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
