import { useMemo, useState, type MouseEvent } from "react";
import { useConnectedWallets, useWallet } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";
import type { ChainKind } from "@/wallet/types";
import { chainLabel, FIXED_CHAIN_KINDS } from "@/config/chains";


export function WalletConnectDialog({
  onClose,
  title = "Payment wallet",
  description = `${FIXED_CHAIN_KINDS.size > 1 ? "Connect a wallet per chain. " + Array.from(FIXED_CHAIN_KINDS.values()).map((option) => option.chainKindLabel).join(", ") + " can stay connected at the same time. " : ""}The connected wallet is used when you send payouts.`,
  preferredKind = "evm",
}: {
  onClose: () => void;
  title?: string;
  description?: string;
  preferredKind?: ChainKind;
}) {
  const connected = useConnectedWallets();
  const [selectedKind, setSelectedKind] = useState<ChainKind>(preferredKind);
  const wallet = useWallet(selectedKind);
  const address = wallet.account?.address || null;

  const kindHint = useMemo(() => {
    if (selectedKind === "near") return "Connect a NEAR wallet such as Hot Wallet or Meteor.";
    if (selectedKind === "solana") return "Connect Phantom or Solflare.";
    if (selectedKind === "tron") return "Connect TronLink, OKX, or WalletConnect.";
    return "Connect an EVM wallet such as MetaMask or OKX.";
  }, [selectedKind]);

  const closeOnBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 px-4"
      onClick={closeOnBackdrop}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-connect-title"
        className="relative w-full max-w-[440px] overflow-hidden rounded-[24px] bg-white text-black shadow-lg ring-1 ring-black/10"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-full text-[#606060] transition-colors hover:bg-black/5"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <div className="px-6 pt-6 pb-2">
          <h2 id="wallet-connect-title" className="font-montserrat text-[20px] font-semibold text-black">
            {title}
          </h2>
          <p className="mt-1 font-montserrat text-[13px] leading-5 text-[#606060]">
            {description}
          </p>
        </div>

        <div className="space-y-4 px-6 pb-6">
          {
            FIXED_CHAIN_KINDS.size > 1 && (
              <div className="flex flex-wrap gap-2">
                {Array.from(FIXED_CHAIN_KINDS.values()).map((option) => {
                  const isConnected = Boolean(connected[option.chainKind]);
                  return (
                    <button
                      key={option.chainKind}
                      type="button"
                      onClick={() => setSelectedKind(option.chainKind)}
                      className={cn(
                        "inline-flex h-9 min-w-[72px] flex-1 items-center justify-center rounded-[16px] border font-montserrat text-[12px] font-medium sm:text-[13px]",
                        selectedKind === option.chainKind
                          ? "border-black bg-black text-white"
                          : "border-black/15 bg-white text-black hover:bg-black/5",
                      )}
                    >
                      {option.chainKindLabel}
                      {isConnected ? <span className="ml-1 size-1.5 rounded-full bg-current opacity-70" /> : null}
                    </button>
                  );
                })}
              </div>
            )
          }

          {address ? (
            <>
              <div className="rounded-[16px] border border-black/10 bg-[#f6f6f6] p-4">
                <p className="font-montserrat text-[14px] font-medium text-black">
                  Connected {chainLabel(selectedKind)} wallet
                </p>
                <p className="mt-3 break-all font-montserrat text-[14px] text-black">
                  {address}
                </p>
                <p className="mt-2 font-montserrat text-[12px] leading-5 text-[#606060]">
                  This address is used when you pay from {chainLabel(selectedKind)}.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    wallet.connect();
                  }}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-[24px] border border-black/15 bg-white font-montserrat text-[15px] font-medium text-black transition-colors hover:bg-black/5"
                >
                  {wallet.isConnecting ? "Connecting…" : "Switch wallet"}
                </button>
                <button
                  type="button"
                  onClick={() => wallet.disconnect()}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-[24px] border border-black/15 bg-white font-montserrat text-[15px] font-medium text-black transition-colors hover:bg-black/5"
                >
                  Disconnect
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  wallet.connect();
                  onClose();
                }}
                className="inline-flex h-12 w-full items-center justify-center rounded-[24px] border border-black/15 bg-white font-montserrat text-[15px] font-medium text-black transition-colors hover:bg-black/5"
              >
                {wallet.isConnecting ? "Connecting…" : "Connect wallet"}
              </button>
              <p className="font-montserrat text-[12px] leading-5 text-[#606060]">{kindHint}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
