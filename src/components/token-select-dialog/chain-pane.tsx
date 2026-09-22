import type { ReactNode } from "react";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { FLOATING_SIDE } from "@/components/ui/overlay/use-floating-position";
import { chainLabel, type ChainConfig } from "@/config/chains";
import { chainLogoUrl } from "@/lib/logo";
import { cn } from "@/lib/utils";
import type { WalletChainKind } from "@/utils";
import { ChainWalletStatus } from "./chain-wallet-status";
import { isBlockchainDisabled, isChainKindLocked } from "./utils";

export type ChainPaneProps = {
  chains: ChainConfig[];
  onSelectFilter: (filter: string) => void;
  lockChainKind?: WalletChainKind | null;
  disabledBlockchains?: string[] | null;
  disabledReason?: string;
};

function lockReason(lockChainKind: WalletChainKind): string {
  return `Recipient address is on ${chainLabel(lockChainKind)}; edit the recipient to change chain`;
}

export function ChainPane({
  chains,
  onSelectFilter,
  lockChainKind = null,
  disabledBlockchains = null,
  disabledReason,
}: ChainPaneProps) {
  function wrapDisabled(disabled: boolean, reason: string | undefined, content: ReactNode) {
    if (!disabled || !reason) return content;
    return (
      <Tooltip side={FLOATING_SIDE.Right} triggerClassName="min-w-0 flex-1" content={reason}>
        {content}
      </Tooltip>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="shrink-0 font-montserrat text-sm font-medium text-[#aaa]">All Networks</p>
      <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto">
        {chains.map((chain) => {
          const locked = isChainKindLocked(chain.chainKind, lockChainKind);
          const chainDisabled = isBlockchainDisabled(chain.blockchain, disabledBlockchains);
          const disabled = locked || chainDisabled;
          const reason = chainDisabled
            ? disabledReason
            : locked && lockChainKind
              ? lockReason(lockChainKind)
              : undefined;
          return (
            <div
              key={chain.blockchain}
              className={cn(
                "flex min-h-14 w-full items-center gap-2 rounded-[12px] px-2 md:min-h-[66px] md:gap-3 md:px-3",
                disabled ? "opacity-40" : "hover:bg-[#F6F6F6]",
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
                  <span className="truncate font-montserrat text-sm font-medium text-black md:text-base">
                    {chain.chainName}
                  </span>
                </button>,
              )}
              <ChainWalletStatus kind={chain.chainKind} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
