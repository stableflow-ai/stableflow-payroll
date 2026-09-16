import type { ReactNode } from "react";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { FLOATING_SIDE } from "@/components/ui/overlay/use-floating-position";
import { chainLabel, type ChainConfig } from "@/config/chains";
import { chainLogoUrl } from "@/lib/logo";
import { cn } from "@/lib/utils";
import type { WalletChainKind } from "@/utils";
import { ALL_CHAIN_FILTER } from "./config";
import { isBlockchainDisabled, isChainKindLocked } from "./utils";

export type NetworkChipsProps = {
  chainFilter: string;
  chips: ChainConfig[];
  overflowCount: number;
  fundedBlockchains: ReadonlySet<string>;
  lockChainKind?: WalletChainKind | null;
  disabledBlockchains?: string[] | null;
  disabledReason?: string;
  onSelectFilter: (filter: string) => void;
  onOpenNetworks: () => void;
};

function chipClass(selected: boolean, disabled: boolean) {
  return cn(
    "relative flex size-[50px] shrink-0 items-center justify-center rounded-[12px] border border-solid",
    selected ? "border-[#06f] bg-[rgba(0,102,255,0.1)]" : "border-[#e3e3e3] bg-[#fdfdfd]",
    disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-black/5",
  );
}

export function NetworkChips({
  chainFilter,
  chips,
  overflowCount,
  fundedBlockchains,
  lockChainKind = null,
  disabledBlockchains = null,
  disabledReason,
  onSelectFilter,
  onOpenNetworks,
}: NetworkChipsProps) {
  function wrapDisabled(disabled: boolean, reason: string | undefined, content: ReactNode) {
    if (!disabled || !reason) return content;
    return (
      <Tooltip side={FLOATING_SIDE.Top} content={reason}>
        {content}
      </Tooltip>
    );
  }

  return (
    <div className="flex gap-[9px]">
      <button
        type="button"
        onClick={() => onSelectFilter(ALL_CHAIN_FILTER)}
        className={chipClass(chainFilter === ALL_CHAIN_FILTER, false)}
      >
        <span className="font-montserrat text-sm font-medium text-black">All</span>
      </button>
      {chips.map((chain) => {
        const locked = isChainKindLocked(chain.chainKind, lockChainKind);
        const chainDisabled = isBlockchainDisabled(chain.blockchain, disabledBlockchains);
        const disabled = locked || chainDisabled;
        const reason = chainDisabled
          ? disabledReason
          : locked
            ? `Recipient address is on ${chainLabel(lockChainKind!)}; edit the recipient to change chain`
            : undefined;
        return (
          <span key={chain.blockchain}>
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
                className={chipClass(chainFilter === chain.blockchain, disabled)}
              >
                <img
                  src={chainLogoUrl(chain.blockchain)}
                  alt=""
                  className="size-8 object-cover"
                />
                {fundedBlockchains.has(chain.blockchain) ? (
                  <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-[#06f]" />
                ) : null}
              </button>,
            )}
          </span>
        );
      })}
      {overflowCount > 0 ? (
        <button
          type="button"
          onClick={onOpenNetworks}
          className={chipClass(false, false)}
        >
          <span className="font-montserrat text-sm font-medium text-black">{overflowCount}+</span>
        </button>
      ) : null}
    </div>
  );
}
