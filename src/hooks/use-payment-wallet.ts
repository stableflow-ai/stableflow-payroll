import { useCallback } from "react";
import { useEvmWalletInfo } from "@/hooks/use-evm-wallet-info";
import { useWallet } from "@/hooks/use-wallet";
import type { ChainKind } from "@/wallet";
import { useSquadsMode } from "@/wallet/solana/multisig";
import { zecQuoteAddressesFrom } from "@/wallet/zec/quote-addresses";
import { useZecWalletContext } from "@/wallet/zec/provider";

export function usePaymentWallet(chainKind: ChainKind = "evm") {
  const wallet = useWallet(chainKind);
  const walletInfo = useEvmWalletInfo();
  const zec = useZecWalletContext();
  const squads = useSquadsMode();
  const connectedAddress = wallet.account?.address || null;
  const zecQuote = chainKind === "zec"
    ? zecQuoteAddressesFrom(zec.shieldedAddress, zec.transparentAddress)
    : null;
  const sdkVault = chainKind === "solana" && squads.mode === "sdk" ? squads.vaultAddress : null;
  const quotePayer = chainKind === "zec"
    ? zecQuote?.payer ?? null
    : sdkVault || connectedAddress;
  const quoteRefundTo = chainKind === "zec"
    ? zecQuote?.refundTo ?? null
    : sdkVault || connectedAddress;

  const ensureWalletReady = useCallback(async (): Promise<boolean> => {
    if (!wallet.isConnected || !connectedAddress) {
      wallet.connect();
      return false;
    }
    return true;
  }, [connectedAddress, wallet]);

  return {
    wallet,
    walletInfo,
    connectedAddress,
    quotePayer,
    quoteRefundTo,
    connectWallet: wallet.connect,
    disconnect: wallet.disconnect,
    ensureWalletReady,
  };
}
