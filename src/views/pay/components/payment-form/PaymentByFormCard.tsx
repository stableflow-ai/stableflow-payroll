import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconEmail, IconLock } from "@/components/icons";
import { Button } from "@/components/ui/button/Button";
import { BATCH_BLOCKCHAINS } from "@/config/chains";
import { queryKeys } from "@/api/query-keys";
import { usePayOriginToken } from "@/hooks/use-pay-origin-token";
import { usePayablePayQuery, usePayablesQuery } from "@/hooks/use-payable-api";
import { usePaymentWallet } from "@/hooks/use-payment-wallet";
import { useTokenBalancesStore } from "@/stores/token-balances";
import { useIntentsTokensStore } from "@/stores/intents-tokens";
import { useAuthStore } from "@/stores/auth";
import { enqueueBatchPayoutCommit } from "@/stores/batch-payout-commit-queue";
import {
  isBatchConsumed,
  markBatchConsumed,
  useConsumedBatchesStore,
} from "@/stores/consumed-batches";
import useToast from "@/hooks/use-toast";
import { organizationId } from "@/lib/auth-role";
import { formatAmount, browserTimeZone } from "@/utils";
import { cn } from "@/lib/utils";
import { broadcastBatchPayout } from "@/wallet/broadcast-batch-payout";
import { INSUFFICIENT_APPROVAL_AMOUNT_MESSAGE } from "@/wallet/config";
import { assertNativeZecSpendable, zecSpendableGateMessage } from "@/wallet/zec/balance";
import { ZCASH_TRANSPARENT_REFUND_MESSAGE } from "@/wallet/zec/config";
import type { ChainKind } from "@/wallet";
import {
  findPayable,
  parsePayableKey,
  payableKeyId,
  type Payable,
  type PayableKey,
} from "@/types/payable";
import {
  AMOUNT_MAX_DECIMALS,
  INSUFFICIENT_APPROVAL_REQUOTE_MESSAGE,
  QUOTE_EXPIRED_MESSAGE,
  SPENT_BATCH_MESSAGE,
  ZCASH_BATCH_UNSUPPORTED_MESSAGE,
  ZCASH_DISABLED_BLOCKCHAINS,
} from "../../config";
import { isBatchOriginToken, isPayrollBatchExpired } from "../../batch-utils";
import { formatQuoteErrorMessage } from "../../utils";
import { YouPaySection } from "../YouPaySection";
import { NotifyRecipientBar } from "../NotifyRecipientBar";
import { NotifyRecipientsDrawer } from "./NotifyRecipientsDrawer";
import { PaymentFormBatchRows } from "./PaymentFormBatchRows";
import { PaymentFormDetailsDrawer } from "./PaymentFormDetailsDrawer";
import { PaymentFormSelect } from "./PaymentFormSelect";
import { batchPayoutCommitTitle } from "./config";
import {
  buildPayablePayRequest,
  payableItemIds,
  payableQuotePayments,
  payableQuoteSourceAmount,
  sumQuoteDestinationVolume,
} from "./utils";

class BalanceGateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BalanceGateError";
  }
}

export function PaymentByFormCard(props: {
  payable?: PayableKey;
  form?: Payable;
  formLocked?: boolean;
  onSettled?: () => void;
  initialNetPayById?: Record<number, string>;
}) {
  const {
    payable: payableProp,
    form: formProp,
    formLocked = false,
    onSettled,
    initialNetPayById,
  } = props;
  const queryClient = useQueryClient();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  const timezone = browserTimeZone();
  const ensureFresh = useIntentsTokensStore((s) => s.ensureFresh);
  const fetchOneBalance = useTokenBalancesStore((s) => s.fetchOne);

  const lockedForm = formLocked && formProp ? formProp : null;
  const [pickedId, setPickedId] = useState(
    lockedForm
      ? payableKeyId(lockedForm.key)
      : payableProp
        ? payableKeyId(payableProp)
        : "",
  );
  const [phase, setPhase] = useState<"idle" | "sending" | "done">("idle");
  const [sendingQuoteBatchId, setSendingQuoteBatchId] = useState<string | null>(null);
  const [paidQuoteBatchIds, setPaidQuoteBatchIds] = useState<Set<string>>(() => new Set());
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(() => new Set());
  const [netPayById, setNetPayById] = useState<Record<number, string>>(
    () => initialNetPayById ?? {},
  );
  const initialNetPayRef = useRef(initialNetPayById);
  initialNetPayRef.current = initialNetPayById;
  const paidQuoteBatchIdsRef = useRef(paidQuoteBatchIds);
  paidQuoteBatchIdsRef.current = paidQuoteBatchIds;
  const refreshedForBatchId = useRef("");

  useEffect(() => {
    void ensureFresh();
  }, [ensureFresh]);

  useEffect(() => {
    if (lockedForm) {
      setPickedId(payableKeyId(lockedForm.key));
      return;
    }
    if (payableProp) setPickedId(payableKeyId(payableProp));
  }, [lockedForm, payableProp]);

  const selectedId = formLocked
    ? (lockedForm
        ? payableKeyId(lockedForm.key)
        : payableProp
          ? payableKeyId(payableProp)
          : "")
    : pickedId;
  const selectedKey = parsePayableKey(selectedId);
  const formsQuery = usePayablesQuery({ enabled: !lockedForm });
  const forms = formsQuery.data ?? [];
  const formsLoading = lockedForm ? false : formsQuery.isPending;
  const formsFetching = lockedForm ? false : formsQuery.isFetching;
  const detail = lockedForm
    ?? (selectedKey ? findPayable(forms, selectedKey) : null);
  const lockedForms = formLocked ? (detail ? [detail] : []) : forms;
  const zcashBatchDisabled = (detail?.items.length ?? 0) > 1;
  const { originToken, setOriginToken } = usePayOriginToken(BATCH_BLOCKCHAINS, {
    excludeBlockchains: zcashBatchDisabled ? ZCASH_DISABLED_BLOCKCHAINS : null,
  });
  const originKind: ChainKind =
    originToken?.chain.chainKind === "near"
    || originToken?.chain.chainKind === "solana"
    || originToken?.chain.chainKind === "tron"
    || originToken?.chain.chainKind === "zec"
      ? originToken.chain.chainKind
      : "evm";
  const paymentWallet = usePaymentWallet(originKind);
  const wallet = paymentWallet.wallet;
  const connectedAddress = paymentWallet.connectedAddress;
  const quotePayer = paymentWallet.quotePayer;
  const quoteRefundTo = paymentWallet.quoteRefundTo;
  const zecQuoteBlocked = originKind === "zec"
    && Boolean(connectedAddress)
    && (!quotePayer || !quoteRefundTo);

  useEffect(() => {
    setNotifyEnabled(false);
    setNotifyOpen(false);
    setDetailsOpen(false);
    setSelectedItemIds(new Set());
    setNetPayById(initialNetPayRef.current ?? {});
    setPaidQuoteBatchIds(new Set());
    setSendingQuoteBatchId(null);
    setPhase("idle");
  }, [selectedId]);

  const payBody = useMemo(
    () =>
      buildPayablePayRequest({
        payable: detail,
        originToken,
        payer: quotePayer,
        refundTo: quoteRefundTo,
        organizationId: orgId,
        timezone,
        notifyEnabled,
        selectedItemIds: [...selectedItemIds],
        netPayById,
      }),
    [
      detail,
      originToken,
      quotePayer,
      quoteRefundTo,
      orgId,
      timezone,
      notifyEnabled,
      selectedItemIds,
      netPayById,
    ],
  );

  const quoteQuery = usePayablePayQuery(payBody);
  const quote = payBody ? quoteQuery.data : undefined;
  const batches = quote?.batches ?? [];
  const isSplit = batches.length > 1;
  const firstQuoteBatchId = batches[0]?.quoteBatchId ?? "";
  const paymentStarted = paidQuoteBatchIds.size > 0;
  const formKey = detail ? payableKeyId(detail.key) : "";
  const consumedItems = useConsumedBatchesStore((state) => state.items);
  const firstBatchConsumed = Boolean(firstQuoteBatchId)
    && consumedItems.some((item) => item.batchId === firstQuoteBatchId);
  const refetchQuote = quoteQuery.refetch;

  useEffect(() => {
    if (isSplit || paymentStarted) return;
    if (!firstBatchConsumed || !firstQuoteBatchId) return;
    if (phase === "sending" || phase === "done") return;
    if (refreshedForBatchId.current === firstQuoteBatchId) return;
    refreshedForBatchId.current = firstQuoteBatchId;
    void refetchQuote();
  }, [firstBatchConsumed, firstQuoteBatchId, isSplit, paymentStarted, phase, refetchQuote]);

  const quoteStale = Boolean(payBody) && (
    quoteQuery.isPlaceholderData
    || (quoteQuery.isPending && quoteQuery.isFetching)
  );
  const quoteError = zecQuoteBlocked
    ? ZCASH_TRANSPARENT_REFUND_MESSAGE
    : quoteQuery.isError
      ? formatQuoteErrorMessage(quoteQuery.error, 2)
      : null;
  const quoting = Boolean(payBody) && (quoteStale || quoteQuery.isFetching) && !quoteError;
  const sourceAmount = quote ? payableQuoteSourceAmount(quote) : "0";
  const youPayQuoted = Boolean(quote);
  const youPayAmount = youPayQuoted
    ? formatAmount(sourceAmount, { prefix: "", maxDecimals: 6 })
    : "0";
  const estCostLabel = youPayQuoted && originToken
    ? `${formatAmount(sourceAmount, { prefix: "", maxDecimals: 6 })} ${originToken.symbol}`
    : "-";
  const totalValuedAmount = youPayQuoted
    ? sumQuoteDestinationVolume(payableQuotePayments(quote!))
    : "0";
  const totalValuedLabel = formatAmount(totalValuedAmount, {
    maxDecimals: AMOUNT_MAX_DECIMALS,
  });
  const emailCount = detail?.items.length ?? 0;

  const settleMutation = useMutation({
    mutationFn: async (quoteBatchId: string) => {
      const quoted = batches.find((row) => row.quoteBatchId === quoteBatchId);
      const batch = quoted?.batch;
      if (!originToken || !payBody || !quote || !batch || !connectedAddress) {
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
      if (originKind === "zec" && (detail?.items.length ?? 0) > 1) {
        toast.fail({ title: ZCASH_BATCH_UNSUPPORTED_MESSAGE });
        throw new BalanceGateError(ZCASH_BATCH_UNSUPPORTED_MESSAGE);
      }
      if (isPayrollBatchExpired(batch.deadline)) {
        toast.fail({ title: QUOTE_EXPIRED_MESSAGE });
        if (!paymentStarted) void refetchQuote();
        throw new BalanceGateError(QUOTE_EXPIRED_MESSAGE);
      }
      if (isBatchConsumed(quoteBatchId)) {
        toast.fail({ title: SPENT_BATCH_MESSAGE });
        if (!isSplit && !paymentStarted) void refetchQuote();
        throw new BalanceGateError(SPENT_BATCH_MESSAGE);
      }
      const payer = wallet.account.address;
      const amountIn = BigInt(batch.totalSourceAmountRaw || "0");
      if (import.meta.env.VITE_VIRIFY_BALANCE !== "false") {
        if (originKind === "zec") {
          try {
            await assertNativeZecSpendable(amountIn);
          } catch (error) {
            const title = zecSpendableGateMessage(error);
            toast.fail({ title });
            throw new BalanceGateError(title);
          }
        } else {
          const balance = await fetchOneBalance(payer, originToken);
          if (!balance || balance.status !== "success" || balance.raw == null) {
            toast.fail({ title: "Could not read wallet balance" });
            throw new BalanceGateError("Could not read wallet balance");
          }
          if (balance.raw < amountIn) {
            toast.fail({ title: "Insufficient balance" });
            throw new BalanceGateError("Insufficient balance");
          }
        }
      }
      const tx = batch.transaction;
      if (!tx) {
        throw new Error("Missing batch transaction");
      }
      const batchIndex = batches.findIndex((row) => row.quoteBatchId === quoteBatchId) + 1;
      setPhase("sending");
      setSendingQuoteBatchId(quoteBatchId);
      setNotifyOpen(false);
      markBatchConsumed(quoteBatchId);
      let txHash: string;
      try {
        txHash = await broadcastBatchPayout({
          token: originToken,
          transaction: tx,
          amountIn,
          payer,
        });
      } catch (error) {
        if (
          error instanceof Error
          && error.message === INSUFFICIENT_APPROVAL_AMOUNT_MESSAGE
        ) {
          toast.fail({ title: INSUFFICIENT_APPROVAL_REQUOTE_MESSAGE });
          if (!paymentStarted) void refetchQuote();
          throw new BalanceGateError(INSUFFICIENT_APPROVAL_REQUOTE_MESSAGE);
        }
        throw error;
      }
      enqueueBatchPayoutCommit({
        quoteId: quote.quoteId,
        quoteBatchId,
        txHash,
        title: batchPayoutCommitTitle(detail?.title ?? "", batchIndex, batches.length),
        type: detail?.type ?? "",
        formKey,
      });
      return quoteBatchId;
    },
    onSuccess: (quoteBatchId) => {
      const next = new Set(paidQuoteBatchIdsRef.current);
      next.add(quoteBatchId);
      setPaidQuoteBatchIds(next);
      setSendingQuoteBatchId(null);
      const remaining = batches.filter((row) => !next.has(row.quoteBatchId));
      if (remaining.length > 0) {
        setNotifyOpen(false);
        setPhase("idle");
        return;
      }
      setPhase("done");
      void queryClient.removeQueries({ queryKey: [...queryKeys.payable.all, "pay"] });
      if (!formLocked) setPickedId("");
      setDetailsOpen(false);
      setNotifyOpen(false);
      setNetPayById({});
      setPaidQuoteBatchIds(new Set());
      setPhase("idle");
      onSettled?.();
    },
    onError: (error) => {
      setPhase("idle");
      setSendingQuoteBatchId(null);
      if (error instanceof BalanceGateError) return;
      toast.fail({ title: formatQuoteErrorMessage(error, 2) });
    },
  });

  const sending = settleMutation.isPending || phase === "sending";
  const formPicked = Boolean(selectedId);
  const formSelected = Boolean(selectedId && detail);
  const quoteReady = Boolean(quote && !quoteStale && !quoteError);
  const canSendSingle = Boolean(
    formSelected
    && isBatchOriginToken(originToken)
    && payBody
    && quoteReady
    && firstQuoteBatchId
    && !firstBatchConsumed
    && !sending
    && !paidQuoteBatchIds.has(firstQuoteBatchId),
  );
  const splitPayDisabled = Boolean(
    !formSelected
    || !isBatchOriginToken(originToken)
    || !payBody
    || !quoteReady
    || sending
    || quoting
    || formsFetching,
  );

  function handleSend(quoteBatchId?: string) {
    if (!connectedAddress) {
      paymentWallet.connectWallet();
      return;
    }
    const target = quoteBatchId || firstQuoteBatchId;
    if (!target) return;
    void settleMutation.mutateAsync(target);
  }

  function handleNotifyEnabled(next: boolean) {
    if (!next) {
      setNotifyEnabled(false);
      setNotifyOpen(false);
      return;
    }
    if (detail) setSelectedItemIds(new Set(payableItemIds(detail)));
    setNotifyEnabled(true);
  }

  function handleNotifyMaster(checked: boolean) {
    handleNotifyEnabled(checked);
  }

  function handleToggleItem(id: number, checked: boolean) {
    const next = new Set(selectedItemIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedItemIds(next);
    if (next.size === 0) {
      setNotifyEnabled(false);
      setNotifyOpen(false);
    }
  }

  const notifyBusy = formPicked && (formsFetching || quoting || sending || paymentStarted);

  return (
    <>
      <div>
        <p className="font-montserrat text-sm font-medium text-[#606060]">Form</p>
        <div className="mt-2">
          <PaymentFormSelect
            forms={lockedForms}
            value={selectedId}
            onChange={(id) => {
              if (formLocked || paymentStarted) return;
              setPickedId(id);
            }}
            disabled={formLocked || paymentStarted}
            loading={formsLoading}
          />
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <p className="font-montserrat text-sm font-medium text-[#606060]">Total Valued</p>
          {detail ? (
            <button
              type="button"
              className="font-montserrat text-sm font-medium text-[#003bff]"
              onClick={() => setDetailsOpen(true)}
            >
              Details
            </button>
          ) : null}
        </div>
        <p
          className={cn(
            "mt-2 font-montserrat text-[26px] font-medium text-black",
            !youPayQuoted && "opacity-30",
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
          tokenSelectDisabled={paymentStarted}
          walletAddress={connectedAddress}
          walletConnected={wallet.isConnected}
          walletIcon={originKind === "evm" ? paymentWallet.walletInfo.icon : wallet.account?.icon}
          connecting={wallet.isConnecting}
          onConnectWallet={() => paymentWallet.connectWallet()}
          onDisconnectWallet={paymentStarted ? undefined : () => paymentWallet.disconnect()}
          allowedBlockchains={BATCH_BLOCKCHAINS}
          disabledBlockchains={zcashBatchDisabled ? ZCASH_DISABLED_BLOCKCHAINS : null}
          disabledReason={zcashBatchDisabled ? ZCASH_BATCH_UNSUPPORTED_MESSAGE : undefined}
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

      <NotifyRecipientBar
        className="mt-6"
        enabled={notifyEnabled}
        disabled={!formSelected || notifyBusy}
        onEnabledChange={handleNotifyEnabled}
      >
        <button
          type="button"
          className="inline-flex items-center gap-[7px] text-[#06F]"
          onClick={() => {
            if (notifyBusy) return;
            if (detail && selectedItemIds.size === 0) {
              setSelectedItemIds(new Set(payableItemIds(detail)));
            }
            setNotifyOpen(true);
          }}
        >
          <IconEmail className="h-[11px] w-[14px]" />
          <span className="font-montserrat text-xs font-normal">
            {emailCount} Email
          </span>
        </button>
      </NotifyRecipientBar>

      {quoteError ? (
        <p className="mt-2 font-montserrat text-sm text-danger">{quoteError}</p>
      ) : null}

      {isSplit ? (
        <PaymentFormBatchRows
          batches={batches}
          sendingQuoteBatchId={sendingQuoteBatchId}
          paidQuoteBatchIds={paidQuoteBatchIds}
          payDisabled={splitPayDisabled}
          onPay={(quoteBatchId) => handleSend(quoteBatchId)}
        />
      ) : (
        <Button
          size="xl"
          className="mt-8 w-full"
          loading={formPicked && (formsFetching || quoting || sending)}
          disabled={!canSendSingle}
          onClick={() => handleSend()}
        >
          {formPicked ? "Send Payment" : "Select Category"}
        </Button>
      )}

      <PaymentFormDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        detail={detail}
        netPayById={netPayById}
        totalVolume={totalValuedAmount}
        canEdit={!paymentStarted}
        onSaveNetPay={setNetPayById}
      />

      <NotifyRecipientsDrawer
        open={notifyOpen && notifyEnabled}
        onClose={() => setNotifyOpen(false)}
        items={detail?.items ?? []}
        selectedIds={selectedItemIds}
        onToggle={handleToggleItem}
        onMasterChange={handleNotifyMaster}
      />
    </>
  );
}
