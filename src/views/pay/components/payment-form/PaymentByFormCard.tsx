import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconLock } from "@/components/icons";
import { Button } from "@/components/ui/button/Button";
import { BATCH_BLOCKCHAINS } from "@/config/chains";
import { queryKeys } from "@/api/query-keys";
import { useCreatePayrollBatchQuery } from "@/hooks/use-batch-payout-api";
import { usePayOriginToken } from "@/hooks/use-pay-origin-token";
import { usePaymentWallet } from "@/hooks/use-payment-wallet";
import {
  usePaymentFormQuery,
  usePaymentFormsQuery,
} from "@/hooks/use-payment-forms-api";
import { useTokenBalancesStore } from "@/stores/token-balances";
import { useIntentsTokensStore } from "@/stores/intents-tokens";
import {
  isBatchConsumed,
  markBatchConsumed,
  useConsumedBatchesStore,
} from "@/stores/consumed-batches";
import useToast from "@/hooks/use-toast";
import { formatAmount } from "@/utils";
import { cn } from "@/lib/utils";
import { broadcastBatchPayout } from "@/wallet/broadcast-batch-payout";
import type { ChainKind } from "@/wallet";
import type { PayrollCreateBatchParam } from "@/types/payout";
import { QUOTE_EXPIRED_MESSAGE, SPENT_BATCH_MESSAGE } from "../../config";
import { isBatchOriginToken, isPayrollBatchExpired } from "../../batch-utils";
import { formatQuoteErrorMessage } from "../../utils";
import { YouPaySection } from "../YouPaySection";
import { PaymentFormSelect } from "./PaymentFormSelect";

class BalanceGateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BalanceGateError";
  }
}

export function PaymentByFormCard(props: {
  formId?: string;
  formLocked?: boolean;
  onSettled?: () => void;
}) {
  const { formId: formIdProp, formLocked = false, onSettled } = props;
  const queryClient = useQueryClient();
  const toast = useToast();
  const ensureFresh = useIntentsTokensStore((s) => s.ensureFresh);
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

  const [pickedId, setPickedId] = useState(formIdProp ?? "");
  const [phase, setPhase] = useState<"idle" | "sending" | "done">("idle");
  const refreshedForBatchId = useRef("");

  useEffect(() => {
    void ensureFresh();
  }, [ensureFresh]);

  useEffect(() => {
    if (formIdProp !== undefined) setPickedId(formIdProp);
  }, [formIdProp]);

  const selectedId = formLocked ? (formIdProp ?? "") : pickedId;
  const formsQuery = usePaymentFormsQuery();
  const detailQuery = usePaymentFormQuery(selectedId);
  const forms = formLocked
    ? (detailQuery.data ? [detailQuery.data] : [])
    : (formsQuery.data ?? []);
  const detail = detailQuery.data;

  const batchBody = useMemo((): PayrollCreateBatchParam | null => {
    const payments = detail?.payments;
    if (!payments?.length || !originToken || !connectedAddress) return null;
    if (!isBatchOriginToken(originToken)) return null;
    return {
      payer: connectedAddress,
      source_network: originToken.blockchain,
      source_symbol: originToken.symbol,
      payments,
    };
  }, [detail, originToken, connectedAddress]);

  const batchQuery = useCreatePayrollBatchQuery(batchBody);
  const batch = batchBody ? batchQuery.data : undefined;
  const batchId = batch?.batchId ?? "";
  const batchConsumed = useConsumedBatchesStore(
    (state) => Boolean(batchId) && state.items.some((item) => item.batchId === batchId),
  );
  const refetchBatch = batchQuery.refetch;

  useEffect(() => {
    if (!batchConsumed || !batchId) return;
    if (phase === "sending" || phase === "done") return;
    if (refreshedForBatchId.current === batchId) return;
    refreshedForBatchId.current = batchId;
    void refetchBatch();
  }, [batchConsumed, batchId, phase, refetchBatch]);

  const quoteStale = Boolean(batchBody) && (
    batchQuery.isPlaceholderData
    || (batchQuery.isPending && batchQuery.isFetching)
  );
  const quoteError = batchQuery.isError
    ? formatQuoteErrorMessage(batchQuery.error, 2)
    : null;
  const quoting = Boolean(batchBody) && (quoteStale || batchQuery.isFetching) && !quoteError;
  const youPayQuoted = Boolean(batch?.totalSourceAmount);
  const youPayAmount = youPayQuoted
    ? formatAmount(batch!.totalSourceAmount, { prefix: "", maxDecimals: 6 })
    : "0";
  const estCostLabel = youPayQuoted && originToken
    ? `${formatAmount(batch!.totalSourceAmount, { prefix: "", maxDecimals: 6 })} ${originToken.symbol}`
    : "-";
  const totalValuedLabel = detail
    ? formatAmount(detail.totalValued, { maxDecimals: 0 })
    : "$0";

  const settleMutation = useMutation({
    mutationFn: async () => {
      if (!originToken || !batchBody || !batch || !connectedAddress) {
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
      if (isPayrollBatchExpired(batch.deadline)) {
        toast.fail({ title: QUOTE_EXPIRED_MESSAGE });
        void refetchBatch();
        throw new BalanceGateError(QUOTE_EXPIRED_MESSAGE);
      }
      if (isBatchConsumed(batch.batchId)) {
        toast.fail({ title: SPENT_BATCH_MESSAGE });
        void refetchBatch();
        throw new BalanceGateError(SPENT_BATCH_MESSAGE);
      }
      const payer = wallet.account.address;
      const amountIn = BigInt(batch.totalSourceAmountRaw || "0");
      const balance = await fetchOneBalance(payer, originToken);
      if (!balance || balance.status !== "success" || balance.raw == null) {
        toast.fail({ title: "Could not read wallet balance" });
        throw new BalanceGateError("Could not read wallet balance");
      }
      if (balance.raw < amountIn && import.meta.env.VITE_VIRIFY_BALANCE !== "false") {
        toast.fail({ title: "Insufficient balance" });
        throw new BalanceGateError("Insufficient balance");
      }
      const tx = batch.transaction;
      if (!tx) {
        throw new Error("Missing batch transaction");
      }
      setPhase("sending");
      markBatchConsumed(batch.batchId);
      await broadcastBatchPayout({
        token: originToken,
        transaction: tx,
        amountIn,
        payer,
      });
    },
    onSuccess: () => {
      setPhase("done");
      toast.success({ title: "Payment submitted" });
      void queryClient.removeQueries({ queryKey: [...queryKeys.payout.all, "payroll-batch"] });
      if (!formLocked) setPickedId("");
      setPhase("idle");
      onSettled?.();
    },
    onError: (error) => {
      setPhase("idle");
      if (error instanceof BalanceGateError) return;
      toast.fail({ title: formatQuoteErrorMessage(error, 2) });
    },
  });

  const sending = settleMutation.isPending || phase === "sending";
  const formPicked = Boolean(selectedId);
  const formSelected = Boolean(selectedId && detail);
  const canSend = Boolean(
    formSelected
    && isBatchOriginToken(originToken)
    && batchBody
    && batch
    && !quoteStale
    && !quoteError
    && !batchConsumed
    && !sending,
  );

  function handleSend() {
    if (!connectedAddress) {
      paymentWallet.connectWallet();
      return;
    }
    void settleMutation.mutateAsync();
  }

  return (
    <>
      <div>
        <p className="font-montserrat text-sm font-medium text-[#606060]">Form</p>
        <div className="mt-2">
          <PaymentFormSelect
            forms={forms}
            value={selectedId}
            onChange={(id) => {
              if (formLocked) return;
              setPickedId(id);
            }}
            disabled={formLocked}
          />
        </div>
      </div>

      <div className="mt-8">
        <p className="font-montserrat text-sm font-medium text-[#606060]">Total Valued</p>
        <p
          className={cn(
            "mt-2 font-montserrat text-[26px] font-medium text-black",
            !detail && "opacity-30",
          )}
        >
          {totalValuedLabel}
        </p>
      </div>

      <div className="mt-6 h-px w-full bg-[#e3e3e3]" />

      <div className="mt-5">
        <YouPaySection
          amountDisplay={youPayAmount}
          amountClassName={youPayQuoted ? undefined : "opacity-30"}
          originToken={originToken}
          onOriginTokenChange={setOriginToken}
          walletAddress={connectedAddress}
          walletConnected={wallet.isConnected}
          walletIcon={originKind === "evm" ? paymentWallet.walletInfo.icon : null}
          connecting={wallet.isConnecting}
          onConnectWallet={() => paymentWallet.connectWallet()}
          onDisconnectWallet={() => paymentWallet.disconnect()}
          allowedBlockchains={BATCH_BLOCKCHAINS}
        />
      </div>

      <div className="mt-4 h-px w-full bg-[#e3e3e3]" />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="font-montserrat text-xs text-[#70788a]">
          Est. Cost {estCostLabel}
        </span>
        <span className="inline-flex h-[26px] items-center gap-1.5 rounded-[13px] border border-[#d0f348] bg-[rgba(208,243,72,0.2)] px-2.5 font-montserrat text-xs font-medium text-[#84a20f]">
          <IconLock className="size-3" />
          Private by default
        </span>
      </div>

      {quoteError ? (
        <p className="mt-2 font-montserrat text-sm text-danger">{quoteError}</p>
      ) : null}

      <Button
        size="xl"
        className="mt-8 w-full"
        loading={formPicked && (detailQuery.isFetching || quoting || sending)}
        disabled={!canSend}
        onClick={handleSend}
      >
        {formPicked ? "Send Payment" : "Select Category"}
      </Button>
    </>
  );
}
