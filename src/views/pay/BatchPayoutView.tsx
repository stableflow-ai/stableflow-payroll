import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { TokenSelectDialog } from "@/components/token-select-dialog/TokenSelectDialog";
import { BATCH_BLOCKCHAINS } from "@/config/chains";
import { queryKeys } from "@/api/query-keys";
import { useBatchPayQuote, useBatchPaySwap } from "@/hooks/use-batch-payout-api";
import { usePayOriginToken } from "@/hooks/use-pay-origin-token";
import { usePaymentWallet } from "@/hooks/use-payment-wallet";
import { useTokenBalance } from "@/hooks/use-token-balances";
import { useConnectedWallets } from "@/hooks/use-wallet";
import useToast from "@/hooks/use-toast";
import { useIntentsTokensStore } from "@/stores/intents-tokens";
import { enqueueBatchPayoutCommit } from "@/stores/batch-payout-commit-queue";
import { useTokenBalancesStore } from "@/stores/token-balances";
import { formatAmount } from "@/utils";
import { broadcastBatchPayout } from "@/wallet/broadcast-batch-payout";
import type { ChainKind } from "@/wallet";
import type { PayBatchQuoteParam } from "@/types/payout";
import type { PayLayoutOutletContext } from "@/layouts/PayLayout";
import {
  IMPORT_MAX_ROWS,
  ORIGIN_BALANCE_POLL_MS,
  QUICK_PAY_SLIPPAGE_TOLERANCE,
} from "./config";
import {
  allDraftsValid,
  createEmptyDraft,
  feeFromQuote,
  groupTokenBreakdown,
  isBatchOriginToken,
  parseImportRows,
  patchDraft,
  refillUnresolvedTokens,
  sumDraftAmounts,
  toBatchReceives,
  type BatchDraft,
  type BatchDraftPatch,
} from "./batch-utils";
import { formatQuoteErrorMessage } from "./utils";
import { BatchPreviewStep } from "./components/batch/BatchPreviewStep";
import { BatchStepper } from "./components/batch/BatchStepper";
import { BatchUploadStep } from "./components/batch/BatchUploadStep";
import { BatchValidateStep, formatBatchTotal } from "./components/batch/BatchValidateStep";

type PageStep = "upload" | "validate" | "preview";

class BalanceGateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BalanceGateError";
  }
}

export function BatchPayoutView() {
  const { setHeaderExtra } = useOutletContext<PayLayoutOutletContext>();
  const queryClient = useQueryClient();
  const toast = useToast();
  const ensureFresh = useIntentsTokensStore((s) => s.ensureFresh);
  const findByChainAndSymbol = useIntentsTokensStore((s) => s.findByChainAndSymbol);
  const tokensReady = useIntentsTokensStore((s) => s.tokens.length > 0);
  const { originToken, setOriginToken } = usePayOriginToken(BATCH_BLOCKCHAINS);
  const originKind: ChainKind =
    originToken?.chain.chainKind === "near" || originToken?.chain.chainKind === "solana"
      ? originToken.chain.chainKind
      : originToken?.chain.chainKind === "tron"
        ? "tron"
        : "evm";
  const paymentWallet = usePaymentWallet(originKind);
  const wallet = paymentWallet.wallet;
  const connectedAddress = paymentWallet.connectedAddress;
  const fetchOneBalance = useTokenBalancesStore((s) => s.fetchOne);
  const originBalance = useTokenBalance(connectedAddress, originToken?.assetId);
  const balanceOwners = useConnectedWallets();
  const swapMutation = useBatchPaySwap();

  const [pageStep, setPageStep] = useState<PageStep>("upload");
  const [rows, setRows] = useState<BatchDraft[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [originDialogOpen, setOriginDialogOpen] = useState(false);
  const [destRowId, setDestRowId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "quoting" | "sending" | "done">("idle");

  useEffect(() => {
    void ensureFresh();
  }, [ensureFresh]);

  useEffect(() => {
    const stepper = (
      <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2">
        <BatchStepper active={pageStep === "preview" ? 2 : 1} />
      </div>
    );
    setHeaderExtra(stepper);
    return () => setHeaderExtra(null);
  }, [pageStep, setHeaderExtra]);

  useEffect(() => {
    if (!tokensReady) return;
    setRows((current) => refillUnresolvedTokens(current, findByChainAndSymbol));
  }, [tokensReady, findByChainAndSymbol]);

  useEffect(() => {
    if (!connectedAddress || !originToken) return;
    void fetchOneBalance(connectedAddress, originToken);
    const id = window.setInterval(() => {
      void fetchOneBalance(connectedAddress, originToken);
    }, ORIGIN_BALANCE_POLL_MS);
    return () => window.clearInterval(id);
  }, [connectedAddress, originToken, fetchOneBalance]);

  const destRow = destRowId ? rows.find((row) => row.id === destRowId) ?? null : null;
  const totalOut = useMemo(() => sumDraftAmounts(rows), [rows]);
  const breakdown = useMemo(() => groupTokenBreakdown(rows), [rows]);
  const receives = useMemo(
    () => (pageStep === "preview" ? toBatchReceives(rows) : []),
    [pageStep, rows],
  );

  const quoteBody = useMemo((): PayBatchQuoteParam | null => {
    if (pageStep !== "preview" || !receives.length || !originToken || !connectedAddress) return null;
    return {
      network: originToken.blockchain,
      token: originToken.symbol,
      payer: connectedAddress,
      refundTo: connectedAddress,
      slippageTolerance: QUICK_PAY_SLIPPAGE_TOLERANCE,
      receives,
    };
  }, [pageStep, receives, originToken, connectedAddress]);

  const dryQuoteQuery = useBatchPayQuote(quoteBody);
  const quote = quoteBody ? dryQuoteQuery.data : undefined;
  const quoteStale = Boolean(quoteBody) && (
    dryQuoteQuery.isPlaceholderData
    || (dryQuoteQuery.isPending && dryQuoteQuery.isFetching)
  );
  const quoteError = dryQuoteQuery.isError
    ? formatQuoteErrorMessage(dryQuoteQuery.error, 2)
    : null;
  const quoting = Boolean(quoteBody) && (quoteStale || dryQuoteQuery.isFetching) && !quoteError;

  const feeRaw = feeFromQuote(quote?.totalAmountInFormatted, totalOut);
  const feeLabel = feeRaw == null
    ? "—"
    : `~${formatAmount(feeRaw, { decimals: 0, maxDecimals: 6 })}`;
  const costLabel = quote?.totalAmountInFormatted
    ? `~${formatAmount(quote.totalAmountInFormatted, { decimals: 0, maxDecimals: 6 })}`
    : "—";

  function applyImported(values: string[][], defaultMemo: string) {
    const parsed = parseImportRows(values, findByChainAndSymbol, defaultMemo);
    if (!parsed.length) {
      toast.fail({ title: "No rows found" });
      return;
    }
    const limited = parsed.slice(0, IMPORT_MAX_ROWS);
    if (parsed.length > IMPORT_MAX_ROWS) {
      toast.fail({ title: `Imported the first ${IMPORT_MAX_ROWS} rows` });
    }
    setRows(limited);
    setShowErrors(false);
    setPageStep("validate");
  }

  function patchRow(rowId: string, patch: BatchDraftPatch) {
    setRows((current) => current.map((row) => (
      row.id === rowId ? patchDraft(row, patch, findByChainAndSymbol) : row
    )));
  }

  function handleContinue() {
    setShowErrors(true);
    if (!originToken) {
      toast.fail({ title: "Select a paying token" });
      return;
    }
    if (!allDraftsValid(rows)) return;
    setPageStep("preview");
  }

  function resetFlow() {
    setPageStep("upload");
    setRows([]);
    setShowErrors(false);
    setPhase("idle");
    void queryClient.removeQueries({ queryKey: [...queryKeys.payout.all, "batch-quote"] });
  }

  const settleMutation = useMutation({
    mutationFn: async () => {
      if (!originToken || !quoteBody || !quote || !connectedAddress) {
        throw new Error("Missing payment inputs");
      }
      if (!wallet.isConnected || !wallet.account?.address) {
        paymentWallet.connectWallet();
        throw new BalanceGateError("Connect your payment wallet first");
      }
      if (!isBatchOriginToken(originToken)) {
        toast.fail({ title: "Select a paying token" });
        throw new BalanceGateError("Select a paying token");
      }
      const payer = wallet.account.address;
      setPhase("quoting");
      const swapped = await swapMutation.mutateAsync(quoteBody);
      const amountIn = BigInt(swapped.totalAmountIn || "0");
      const balance = await fetchOneBalance(payer, originToken);
      if (!balance || balance.status !== "success" || balance.raw == null) {
        toast.fail({ title: "Could not read wallet balance" });
        throw new BalanceGateError("Could not read wallet balance");
      }
      if (balance.raw < amountIn && import.meta.env.VITE_VIRIFY_BALANCE !== "false") {
        toast.fail({ title: "Insufficient balance" });
        throw new BalanceGateError("Insufficient balance");
      }
      const tx = swapped.transaction;
      if (!tx) {
        throw new Error("Missing batch transaction");
      }
      setPhase("sending");
      const txHash = await broadcastBatchPayout({
        token: originToken,
        transaction: tx,
        amountIn,
        payer,
      });
      enqueueBatchPayoutCommit({ orderId: swapped.orderId, txHash });
    },
    onSuccess: () => {
      setPhase("done");
      toast.success({ title: "Payment submitted" });
      resetFlow();
    },
    onError: (error) => {
      if (error instanceof BalanceGateError) {
        setPhase("idle");
        return;
      }
      setPhase("idle");
      toast.fail({ title: formatQuoteErrorMessage(error, 2) });
    },
  });

  const sending = settleMutation.isPending || phase === "quoting" || phase === "sending";
  const canConfirm = Boolean(
    isBatchOriginToken(originToken)
    && quoteBody
    && quote
    && !quoteStale
    && !quoteError
    && !sending,
  );

  function handleConfirm() {
    if (!connectedAddress) {
      paymentWallet.connectWallet();
      return;
    }
    void settleMutation.mutateAsync();
  }

  const originBalanceLabel = originBalance?.formatted != null
    ? formatAmount(originBalance.formatted, { prefix: "", maxDecimals: 6 })
    : "—";

  return (
    <>
      {pageStep === "upload" ? (
        <BatchUploadStep
          onEnterManually={() => {
            setRows([createEmptyDraft()]);
            setShowErrors(false);
            setPageStep("validate");
          }}
          onImported={applyImported}
          onError={(message) => toast.fail({ title: message })}
        />
      ) : null}

      {pageStep === "validate" ? (
        <BatchValidateStep
          originToken={originToken}
          originBalanceLabel={originBalanceLabel}
          originBalanceLoading={originBalance?.status === "loading"}
          rows={rows}
          showErrors={showErrors}
          totalAmountLabel={formatBatchTotal(totalOut)}
          onOpenOriginToken={() => setOriginDialogOpen(true)}
          onOpenDestToken={(rowId) => setDestRowId(rowId)}
          onPatch={patchRow}
          onAdd={() => {
            if (rows.length >= IMPORT_MAX_ROWS) return;
            setRows((current) => [...current, createEmptyDraft()]);
          }}
          onRemove={(rowId) => {
            setRows((current) => current.length <= 1 ? current : current.filter((row) => row.id !== rowId));
          }}
          onBack={() => {
            setPageStep("upload");
            setShowErrors(false);
          }}
          onContinue={handleContinue}
        />
      ) : null}

      {pageStep === "preview" ? (
        <BatchPreviewStep
          totalValued={totalOut}
          breakdown={breakdown}
          payoutCount={rows.length}
          walletAddress={connectedAddress}
          originToken={originToken}
          feeLabel={feeLabel}
          costLabel={costLabel}
          quoteError={quoteError}
          quoting={quoting}
          canConfirm={canConfirm}
          sending={sending}
          onBack={() => {
            setPageStep("validate");
            setPhase("idle");
          }}
          onConfirm={handleConfirm}
        />
      ) : null}

      <TokenSelectDialog
        open={originDialogOpen}
        onClose={() => setOriginDialogOpen(false)}
        title="Paying token"
        selectedAssetId={originToken?.assetId}
        showBalances
        balanceOwners={balanceOwners}
        allowedBlockchains={BATCH_BLOCKCHAINS}
        onSelect={({ token }) => {
          setOriginToken(token);
          setOriginDialogOpen(false);
          const kind = token.chain.chainKind;
          const owner = kind === "evm" || kind === "near" || kind === "solana" || kind === "tron"
            ? balanceOwners[kind]
            : undefined;
          if (owner) void fetchOneBalance(owner, token);
        }}
      />

      <TokenSelectDialog
        open={Boolean(destRow)}
        onClose={() => setDestRowId(null)}
        title="Prefer token"
        selectedAssetId={destRow?.token?.assetId}
        lockChainKind={destRow?.chainKind}
        onSelect={({ token }) => {
          if (!destRowId) return;
          patchRow(destRowId, { token });
          setDestRowId(null);
        }}
      />
    </>
  );
}
