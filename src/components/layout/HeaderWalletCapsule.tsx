import { useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { IconArrowDown } from "@/components/icons/arrow-down";
import { MultisigBadge } from "@/components/multisig/MultisigBadge";
import { WalletConnectDialog } from "@/components/WalletConnect";
import { primaryConnectedAddress, useConnectedWallets } from "@/hooks/use-wallet";
import { chainLogoUrl } from "@/lib/logo";
import { formatAddress } from "@/utils";
import { HEADER_CHAIN_LOGO, primaryConnectedKind } from "./config";

export function HeaderWalletCapsule() {
  const owners = useConnectedWallets();
  const address = primaryConnectedAddress(owners);
  const kind = primaryConnectedKind(owners);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      {address && kind ? (
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-[20px] border border-white bg-[#fdfdfd] pr-3 pl-1 shadow-[0_0_20px_rgba(0,0,0,0.06)]"
        >
          <img
            src={chainLogoUrl(HEADER_CHAIN_LOGO[kind])}
            alt=""
            className="size-[30px] rounded-full object-cover"
          />
          <span className="font-montserrat text-sm text-black">{formatAddress(address)}</span>
          {kind === "evm" || kind === "near" || kind === "solana" ? (
            <MultisigBadge chainKind={kind} />
          ) : null}
          <IconArrowDown className="h-1 w-2.5 text-black" />
        </button>
      ) : (
        <Button
          variant="primary"
          size="md"
          rounded="rounded-full"
          className="px-[22px] !text-sm"
          onClick={() => setDialogOpen(true)}
        >
          Connect Wallet
        </Button>
      )}
      {dialogOpen ? <WalletConnectDialog onClose={() => setDialogOpen(false)} /> : null}
    </>
  );
}
