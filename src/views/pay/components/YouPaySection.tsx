import { useEffect, useState } from "react";
import { TokenNetworkDialog } from "@/components/token-network-dialog/TokenNetworkDialog";
import { formatAddress, formatAmount } from "@/utils";
import type { IntentsToken } from "@/stores/intents-tokens";
import { useTokenBalance } from "@/hooks/use-token-balances";
import { useTokenBalancesStore } from "@/stores/token-balances";
import { useConnectedWallets } from "@/hooks/use-wallet";
import { ORIGIN_BALANCE_POLL_MS } from "@/views/pay/config";
import { TokenSelectButton } from "@/views/pay/components/TokenSelectButton";

export function YouPaySection(props: {
  amountDisplay: string;
  originToken: IntentsToken | null;
  onOriginTokenChange: (token: IntentsToken) => void;
  walletAddress: string | null;
  walletConnected: boolean;
  walletIcon?: string | null;
  connecting: boolean;
  onConnectWallet: () => void;
}) {
  const {
    amountDisplay,
    originToken,
    onOriginTokenChange,
    walletAddress,
    walletConnected,
    walletIcon,
    connecting,
    onConnectWallet,
  } = props;
  const [originDialogOpen, setOriginDialogOpen] = useState(false);
  const balanceOwners = useConnectedWallets();
  const fetchOneBalance = useTokenBalancesStore((s) => s.fetchOne);
  const originBalance = useTokenBalance(walletAddress, originToken?.assetId);

  useEffect(() => {
    if (!walletAddress || !originToken?.contractAddress) return;
    void fetchOneBalance(walletAddress, originToken);
    const id = window.setInterval(() => {
      void fetchOneBalance(walletAddress, originToken);
    }, ORIGIN_BALANCE_POLL_MS);
    return () => window.clearInterval(id);
  }, [walletAddress, originToken, fetchOneBalance]);

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="font-montserrat text-sm font-medium text-[#606060]">You Pay</p>
        <div className="flex items-center gap-1.5">
          {walletAddress && walletConnected && walletIcon ? (
            <img src={walletIcon} alt="" className="size-3 rounded-[2px] object-cover" />
          ) : null}
          {walletAddress ? (
            <p className="font-montserrat text-xs text-[#606060]">{formatAddress(walletAddress)}</p>
          ) : (
            <button
              type="button"
              onClick={onConnectWallet}
              disabled={connecting}
              className="font-montserrat text-xs text-black underline-offset-2 hover:underline disabled:opacity-50"
            >
              {connecting ? "Connecting…" : "Connect wallet"}
            </button>
          )}
        </div>
      </div>
      <div className="mt-1 flex min-w-0 flex-wrap items-end justify-between gap-3">
        <p className="min-w-0 break-all font-montserrat text-base font-medium text-black">
          {amountDisplay}
        </p>
        <TokenSelectButton token={originToken} onClick={() => setOriginDialogOpen(true)} />
      </div>
      <p className="mt-1 font-space-grotesk text-xs">
        <span className="text-[#9fa7ba]">Balance: </span>
        <span className="text-[#0e3616]">
          {originBalance?.formatted != null ? (
            formatAmount(originBalance.formatted, { prefix: "", maxDecimals: 2 })
          ) : originBalance?.status === "loading" ? (
            <span
              className="inline-block size-3 animate-spin rounded-full border-2 border-[#0e3616] border-r-transparent align-middle"
              aria-label="Loading balance"
            />
          ) : (
            "—"
          )}
        </span>
      </p>
      <TokenNetworkDialog
        open={originDialogOpen}
        onClose={() => setOriginDialogOpen(false)}
        title="You pay with"
        initialSymbol={(originToken?.symbol || "USDT") as "USDC" | "USDT"}
        selectedAssetId={originToken?.assetId}
        showBalances
        balanceOwners={balanceOwners}
        onSelect={({ token }) => {
          onOriginTokenChange(token);
          const kind = token.chain.chainKind;
          const owner = kind === "evm" || kind === "near" || kind === "solana"
            ? balanceOwners[kind]
            : undefined;
          if (owner) void fetchOneBalance(owner, token);
        }}
      />
    </>
  );
}
