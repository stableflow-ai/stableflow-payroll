import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { usePayOriginToken } from "@/hooks/use-pay-origin-token";
import { usePaymentWallet } from "@/hooks/use-payment-wallet";
import { useQuickPayCommitQueue } from "@/hooks/use-quick-pay-commit-queue";
import { usePayRequestDetailQuery } from "@/hooks/use-request-payment";
import { useSinglePayQuote, useSinglePaySwap } from "@/hooks/use-single-payout-api";
import useToast from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth";
import { enqueueQuickPayCommit } from "@/stores/quick-pay-commit-queue";
import { useIntentsTokensStore } from "@/stores/intents-tokens";
import { useTokenBalancesStore } from "@/stores/token-balances";
import type { PaySingleQuoteParam, PaySingleSwapParam } from "@/types/payout";
import { formatAmount } from "@/utils";
import { broadcastQuickPayCallData } from "@/wallet/broadcast-quick-pay";
import type { ChainKind } from "@/wallet";
import { RequestPayBackButton } from "./components/request-pay/RequestPayBackButton";
import {
  REQUEST_PAY_CARD_STATE,
  RequestPayCard,
} from "./components/request-pay/RequestPayCard";
import {
  AMOUNT_MAX_DECIMALS,
  PAY_REQUEST_STATUS,
  QUICK_PAY_SLIPPAGE_TOLERANCE,
  QUOTE_DEBOUNCE_MS,
} from "./config";
import {
  applyRequestPayoutFields,
  parsePaymentRequestId,
} from "./request-utils";
import {
  formatQuoteErrorMessage,
  isDryQuoteStale,
  parsePositiveDecimal,
  payoutNetworkToken,
} from "./utils";

class BalanceGateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BalanceGateError";
  }
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function RequestPayView() {
  const { id: idParam } = useParams();
  const requestId = parsePaymentRequestId(idParam);
  const requestQuery = usePayRequestDetailQuery(requestId);
  const request = requestQuery.data ?? null;
  const token = useAuthStore((state) => state.token);
  const guestAuth = { auth: Boolean(token) };
  const toast = useToast();
  useQuickPayCommitQueue();
  const ensureFresh = useIntentsTokensStore((s) => s.ensureFresh);
  const tokens = useIntentsTokensStore((s) => s.tokens);
  const findByChainAndSymbol = useIntentsTokensStore((s) => s.findByChainAndSymbol);
  const { originToken, setOriginToken } = usePayOriginToken();
  const originKind: ChainKind =
    originToken?.chain.chainKind === "near" || originToken?.chain.chainKind === "solana"
      ? originToken.chain.chainKind
      : originToken?.chain.chainKind === "tron"
        ? "tron"
        : "evm";
  const paymentWallet = usePaymentWallet(originKind);
  const wallet = paymentWallet.wallet;
  const connectedAddress = paymentWallet.connectedAddress;
  const walletReady = Boolean(connectedAddress);
  const [paid, setPaid] = useState(false);
  const [phase, setPhase] = useState<"idle" | "quoting" | "sending" | "done" | "error">("idle");

  useEffect(() => {
    void ensureFresh();
  }, [ensureFresh]);

  const destToken = useMemo(() => {
    if (!request) return null;
    const tokenRaw = request.token.toUpperCase();
    const symbol = tokenRaw === "USDT" ? "USDT" : tokenRaw === "USDC" ? "USDC" : null;
    if (!symbol) return null;
    return findByChainAndSymbol(request.network, symbol) ?? null;
  }, [findByChainAndSymbol, request, tokens]);

  const destinationAddress = request?.recipient_address.trim() ?? "";
  const amountForQuote = request ? parsePositiveDecimal(request.amount, AMOUNT_MAX_DECIMALS) : null;
  const debouncedAmountForQuote = useDebouncedValue(amountForQuote, QUOTE_DEBOUNCE_MS);
  const requestPayable = request?.status === PAY_REQUEST_STATUS.Pending && !paid;

  const quoteBody = useMemo((): PaySingleQuoteParam | null => {
    if (
      !originToken
      || !destToken
      || !debouncedAmountForQuote
      || !destinationAddress
      || !walletReady
      || !connectedAddress
      || !requestId
      || !requestPayable
    ) {
      return null;
    }
    const origin = payoutNetworkToken(originToken);
    const dest = payoutNetworkToken(destToken);
    return applyRequestPayoutFields({
      amount: debouncedAmountForQuote,
      destinationAddress,
      destinationNetwork: dest.network,
      destinationToken: dest.token,
      network: origin.network,
      token: origin.token,
      refundTo: connectedAddress,
      slippageTolerance: QUICK_PAY_SLIPPAGE_TOLERANCE,
      payer: connectedAddress,
    }, requestId);
  }, [
    originToken,
    destToken,
    debouncedAmountForQuote,
    destinationAddress,
    walletReady,
    connectedAddress,
    requestId,
    requestPayable,
  ]);

  const dryQuoteQuery = useSinglePayQuote(quoteBody, guestAuth);
  const swapMutation = useSinglePaySwap(guestAuth);
  const quote = amountForQuote && destinationAddress && destToken ? dryQuoteQuery.data : undefined;
  const dryQuoteStale = isDryQuoteStale({
    amountForQuote,
    debouncedAmountForQuote,
    isPlaceholderData: dryQuoteQuery.isPlaceholderData,
    isPending: dryQuoteQuery.isPending,
    isFetching: dryQuoteQuery.isFetching,
  });
  const quoteError = dryQuoteQuery.isError ? formatQuoteErrorMessage(dryQuoteQuery.error, 2) : null;
  const amountInDisplay = quote?.amountInFormatted
    ? formatAmount(quote.amountInFormatted, { prefix: "", maxDecimals: AMOUNT_MAX_DECIMALS })
    : "—";
  const fetchOneBalance = useTokenBalancesStore((s) => s.fetchOne);

  const settleMutation = useMutation({
    mutationFn: async () => {
      if (!originToken || !destToken || !amountForQuote || !quote || !destinationAddress || !connectedAddress || !requestId) {
        throw new Error("Missing payment inputs");
      }
      if (!wallet.isConnected || !wallet.account?.address) {
        paymentWallet.connectWallet();
        throw new Error("Connect your payment wallet first");
      }
      if (originToken.chain.chainKind !== "evm" || !originToken.chain.chainId || !originToken.contractAddress) {
        toast.fail({ title: "Quick Pay currently supports EVM origin tokens only" });
        throw new BalanceGateError("Unsupported origin chain");
      }
      const paymentWalletAddress = wallet.account.address;
      setPhase("quoting");
      const origin = payoutNetworkToken(originToken);
      const dest = payoutNetworkToken(destToken);
      const swapBody: PaySingleSwapParam = applyRequestPayoutFields({
        amount: amountForQuote,
        destinationAddress,
        destinationNetwork: dest.network,
        destinationToken: dest.token,
        network: origin.network,
        token: origin.token,
        refundTo: paymentWalletAddress,
        slippageTolerance: QUICK_PAY_SLIPPAGE_TOLERANCE,
        payer: paymentWalletAddress,
      }, requestId);
      const memoValue = request?.memo.trim();
      if (memoValue) swapBody.memo = memoValue;

      const swapped = await swapMutation.mutateAsync(swapBody);
      const amountIn = BigInt(swapped.amountIn || "0");
      const balance = await fetchOneBalance(paymentWalletAddress, originToken);
      if (!balance || balance.status !== "success" || balance.raw == null) {
        toast.fail({ title: "Could not read wallet balance" });
        throw new BalanceGateError("Could not read wallet balance");
      }
      if (balance.raw < amountIn) {
        toast.fail({ title: "Insufficient balance" });
        throw new BalanceGateError("Insufficient balance");
      }
      setPhase("sending");
      const txHash = await broadcastQuickPayCallData({
        chainId: originToken.chain.chainId,
        contract: originToken.contractAddress,
        callData: swapped.callData,
      });
      enqueueQuickPayCommit({ orderId: swapped.orderId, txHash });
    },
    onSuccess: () => {
      setPhase("done");
      setPaid(true);
      toast.success({ title: "Payment submitted" });
    },
    onError: (err) => {
      if (err instanceof BalanceGateError) {
        setPhase("idle");
        return;
      }
      setPhase("error");
      toast.fail({ title: formatQuoteErrorMessage(err, 2) });
    },
  });

  const sending = settleMutation.isPending || phase === "quoting" || phase === "sending";
  const quoteLoading = Boolean(amountForQuote && destinationAddress && destToken && originToken && walletReady)
    && (dryQuoteStale || dryQuoteQuery.isFetching);
  const canPay = Boolean(
    destinationAddress
    && destToken
    && amountForQuote
    && originToken
    && quote
    && !dryQuoteStale
    && !quoteError
    && !sending
    && requestPayable,
  );

  const cardState = (() => {
    if (paid) return REQUEST_PAY_CARD_STATE.Paid;
    if (!requestId) return REQUEST_PAY_CARD_STATE.Deleted;
    if (requestQuery.isPending) return REQUEST_PAY_CARD_STATE.Loading;
    if (requestQuery.isError || !request || request.status !== PAY_REQUEST_STATUS.Pending) {
      return REQUEST_PAY_CARD_STATE.Deleted;
    }
    return REQUEST_PAY_CARD_STATE.Pay;
  })();

  function handlePay() {
    if (!connectedAddress) {
      paymentWallet.connectWallet();
      return;
    }
    if (!requestPayable) {
      toast.fail({ title: "This payment request is no longer payable" });
      return;
    }
    void settleMutation.mutateAsync();
  }

  return (
    <div className="px-2 pb-10 md:px-5">
      <div className="mb-6">
        <RequestPayBackButton />
      </div>
      <RequestPayCard
        state={cardState}
        paymentName={request?.name ?? ""}
        createdAt={request?.created_at ?? ""}
        amount={request?.amount ?? "0"}
        destToken={destToken}
        recipientAddress={destinationAddress}
        description={request?.memo ?? ""}
        youPayAmount={amountInDisplay}
        originToken={originToken}
        onOriginTokenChange={setOriginToken}
        walletAddress={connectedAddress}
        walletConnected={wallet.isConnected}
        walletIcon={originKind === "evm" ? paymentWallet.walletInfo.icon : null}
        connecting={wallet.isConnecting}
        onConnectWallet={() => paymentWallet.connectWallet()}
        quoteError={quoteError}
        payLoading={sending || quoteLoading}
        canPay={canPay}
        onPay={handlePay}
      />
    </div>
  );
}
