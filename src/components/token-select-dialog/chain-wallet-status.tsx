import type { MouseEvent } from "react";
import { IconLogout } from "@/components/icons/logout";
import { useWallet } from "@/hooks/use-wallet";
import useToast from "@/hooks/use-toast";
import { formatAddress } from "@/utils";
import { useSafeMode } from "@/wallet/evm/safe";
import type { ChainKind } from "@/wallet";

function stop(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

export function ChainWalletStatus({ kind }: { kind: ChainKind }) {
  const wallet = useWallet(kind);
  const toast = useToast();
  const safeApp = useSafeMode().mode === "app";
  const address = wallet.account?.address;
  const icon = wallet.account?.icon;
  const hideDisconnect = kind === "evm" && safeApp;

  if (!address) {
    return (
      <button
        type="button"
        onClick={(event) => {
          stop(event);
          wallet.connect();
        }}
        className="shrink-0 cursor-pointer font-montserrat text-xs font-medium text-black hover:underline"
      >
        {wallet.isConnecting ? "Connecting…" : "Connect"}
      </button>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-1" onClick={stop}>
      {icon ? (
        <img src={icon} alt="" className="size-3 shrink-0 rounded-[2px] object-cover" />
      ) : null}
      <button
        type="button"
        onClick={async (event) => {
          stop(event);
          try {
            await navigator.clipboard.writeText(address);
            toast.success({ title: "Copied" });
          } catch {
            toast.fail({ title: "Could not copy" });
          }
        }}
        className="truncate font-montserrat text-xs text-[#606060] hover:text-black"
      >
        {formatAddress(address)}
      </button>
      {hideDisconnect ? null : (
        <button
          type="button"
          aria-label="Disconnect"
          onClick={(event) => {
            stop(event);
            wallet.disconnect();
          }}
          className="inline-flex shrink-0 cursor-pointer text-danger"
        >
          <IconLogout className="size-3" />
        </button>
      )}
    </div>
  );
}
