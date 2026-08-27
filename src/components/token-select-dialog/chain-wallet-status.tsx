import type { MouseEvent } from "react";
import { IconCopy } from "@/components/icons/copy";
import { IconLogout } from "@/components/icons/logout";
import { useWallet } from "@/hooks/use-wallet";
import useToast from "@/hooks/use-toast";
import { formatAddress } from "@/utils";
import type { ChainKind } from "@/wallet";

function stop(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

export function ChainWalletStatus({ kind }: { kind: ChainKind }) {
  const wallet = useWallet(kind);
  const toast = useToast();
  const address = wallet.account?.address;

  if (!address) {
    return (
      <button
        type="button"
        onClick={(event) => {
          stop(event);
          wallet.connect();
        }}
        className="shrink-0 cursor-pointer font-montserrat text-[13px] font-medium text-black hover:underline"
      >
        {wallet.isConnecting ? "Connecting…" : "Connect"}
      </button>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-0.5" onClick={stop}>
      <span className="truncate font-montserrat text-[10px] font-medium text-[#606060]">
        {formatAddress(address)}
      </span>
      <button
        type="button"
        aria-label="Copy address"
        onClick={async (event) => {
          stop(event);
          try {
            await navigator.clipboard.writeText(address);
            toast.success({ title: "Copied" });
          } catch {
            toast.fail({ title: "Could not copy" });
          }
        }}
        className="shrink-0 cursor-pointer p-0.5 text-[#909090] hover:text-black"
      >
        <IconCopy className="size-2.5" />
      </button>
      <button
        type="button"
        aria-label="Disconnect"
        onClick={(event) => {
          stop(event);
          wallet.disconnect();
        }}
        className="shrink-0 cursor-pointer p-0.5 text-[#909090] hover:text-black"
      >
        <IconLogout className="size-2.5" />
      </button>
    </div>
  );
}
