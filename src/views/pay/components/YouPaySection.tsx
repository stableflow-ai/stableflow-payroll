import { useEffect, useState } from "react";
import { IconLogout } from "@stableflow/pay-ui/icons/logout";
import { MultisigBadge } from "@/components/multisig/MultisigBadge";
import { TokenSelectDialog } from "@stableflow/pay-widgets/token-select";
import { formatAddress, formatAmount } from "@/utils";
import { useSafeMode } from "@/wallet/evm/safe";
import { cn } from "@/lib/utils";
import { intentsTokenForSelection, type IntentsToken } from "@/stores/intents-tokens";
import { useTokenBalance } from "@/hooks/use-token-balances";
import { useTokenBalancesStore } from "@/stores/token-balances";
import { useConnectedWallets } from "@/hooks/use-wallet";
import { ORIGIN_BALANCE_POLL_MS } from "@/views/pay/config";
import { PayFromSquadSection } from "@/components/multisig/PayFromSquadSection";
import { TokenSelectButton } from "@/views/pay/components/TokenSelectButton";
import { useSquadsMode } from "@/wallet/solana/multisig";

export function YouPaySection(props: {
  amountDisplay: string;
  originToken: IntentsToken | null;
  onOriginTokenChange: (token: IntentsToken) => void;
  walletAddress: string | null;
  signerAddress?: string | null;
  walletConnected: boolean;
  walletIcon?: string | null;
  connecting: boolean;
  onConnectWallet: () => void;
  onDisconnectWallet?: () => void;
  allowedBlockchains?: string[] | null;
  disabledBlockchains?: string[] | null;
  disabledReason?: string;
  amountClassName?: string;
  tokenSelectDisabled?: boolean;
}) {
  const {
    amountDisplay,
    originToken,
    onOriginTokenChange,
    walletAddress,
    signerAddress,
    walletConnected,
    walletIcon,
    connecting,
    onConnectWallet,
    onDisconnectWallet,
    allowedBlockchains = null,
    disabledBlockchains = null,
    disabledReason,
    amountClassName,
    tokenSelectDisabled = false,
  } = props;
  const [originDialogOpen, setOriginDialogOpen] = useState(false);
  const balanceOwners = useConnectedWallets();
  const fetchOneBalance = useTokenBalancesStore((s) => s.fetchOne);
  const originBalance = useTokenBalance(walletAddress, originToken?.assetId);
  const isEvmOrigin = originToken?.chain.chainKind === "evm";
  const isNearOrigin = originToken?.chain.chainKind === "near";
  const isSolanaOrigin = originToken?.chain.chainKind === "solana";
  const originKind = originToken?.chain.chainKind;
  const safeApp = useSafeMode().mode === "app";
  const squads = useSquadsMode();
  const signer = signerAddress || walletAddress;
  const fund = walletAddress;
  const showFund = Boolean(signer && fund && signer !== fund);
  const ownersForBalances = fund && isSolanaOrigin
    ? { ...balanceOwners, solana: fund }
    : balanceOwners;

  useEffect(() => {
    if (!walletAddress || !originToken) return;
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
          {signer ? (
            <>
              <p className="font-montserrat text-xs text-[#606060]">
                {formatAddress(signer)}
                {showFund && fund ? ` · Vault ${formatAddress(fund)}` : ""}
              </p>
              {(isEvmOrigin || isNearOrigin || isSolanaOrigin) && originKind ? (
                <MultisigBadge chainKind={originKind} />
              ) : null}
              {/* Inside the Safe App the connection is the host iframe, so there is
                  nothing this page can disconnect from. */}
              {onDisconnectWallet && !(isEvmOrigin && safeApp) ? (
                <button
                  type="button"
                  aria-label="Disconnect"
                  onClick={onDisconnectWallet}
                  className="inline-flex shrink-0 cursor-pointer text-danger"
                >
                  <IconLogout className="size-3" />
                </button>
              ) : null}
            </>
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
        <p className={cn("min-w-0 break-all font-montserrat text-base font-medium text-black", amountClassName)}>
          {amountDisplay}
        </p>
        <TokenSelectButton
          token={originToken}
          disabled={tokenSelectDisabled}
          onClick={() => setOriginDialogOpen(true)}
        />
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
      {isSolanaOrigin && walletConnected && !squads.isSquadsX ? (
        <PayFromSquadSection visible />
      ) : null}
      <TokenSelectDialog
        open={originDialogOpen}
        onClose={() => setOriginDialogOpen(false)}
        title="Select Token"
        selectedAssetId={originToken?.assetId}
        balanceOwners={ownersForBalances}
        allowedBlockchains={allowedBlockchains}
        disabledBlockchains={disabledBlockchains}
        disabledReason={disabledReason}
        onSelect={({ token }) => {
          const next = intentsTokenForSelection(token);
          if (!next) return;
          onOriginTokenChange(next);
          setOriginDialogOpen(false);
          const owner = next.chain.chainKind === "solana" && fund
            ? fund
            : ownersForBalances[next.chain.chainKind];
          if (owner) void fetchOneBalance(owner, next);
        }}
      />
    </>
  );
}
