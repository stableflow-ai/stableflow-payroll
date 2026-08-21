import { useState } from "react";
import { WalletConnectDialog } from "@/components/WalletConnect";
import { useConnectedWallets } from "@/hooks/use-wallet";
import { formatAddress } from "@/utils";

const CHAIN_ROWS = [
  { kind: "evm" as const, label: "EVM" },
  { kind: "near" as const, label: "Near" },
  { kind: "solana" as const, label: "Solana" },
  { kind: "tron" as const, label: "Tron" },
];

export function PlaceholderHome() {
  const connected = useConnectedWallets();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[#f6f6f6] px-6 text-black">
      <img src="/logo.svg" alt="Stableflow Pay" className="h-10" />
      <p className="mt-6 font-montserrat text-[15px] text-[#606060]">
        Wallet scaffold — connect EVM, Near, Solana, or Tron.
      </p>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="mt-8 inline-flex h-12 items-center justify-center rounded-[24px] bg-black px-8 font-montserrat text-[15px] font-medium text-white transition-opacity hover:opacity-90"
      >
        Connect wallet
      </button>
      <ul className="mt-8 w-full max-w-[440px] space-y-2 font-montserrat text-[13px] text-[#606060]">
        {CHAIN_ROWS.map((row) => {
          const address = connected[row.kind];
          return (
            <li
              key={row.kind}
              className="flex items-center justify-between rounded-[16px] border border-black/10 bg-white px-4 py-3"
            >
              <span className="font-medium text-black">{row.label}</span>
              <span className="break-all text-right">
                {address ? formatAddress(address) : "Not connected"}
              </span>
            </li>
          );
        })}
      </ul>
      {dialogOpen ? <WalletConnectDialog onClose={() => setDialogOpen(false)} /> : null}
    </div>
  );
}
