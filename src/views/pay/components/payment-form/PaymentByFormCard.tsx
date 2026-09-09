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
import { PaymentFormDetailsDrawer } from "./PaymentFormDetailsDrawer";
import { PaymentFormSelect } from "./PaymentFormSelect";
import { buildPayablePayRequest, payableItemIds, sumPayableVolume } from "./utils";

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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(() => new Set());
  const [netPayById, setNetPayById] = useState<Record<number, string>>(
    () => initialNetPayById ?? {},
  );
  const initialNetPayRef = useRef(initialNetPayById);
  initialNetPayRef.current = initialNetPayById;
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

  useEffect(() => {
    setNotifyEnabled(false);
    setNotifyOpen(false);
    setDetailsOpen(false);
    setSelectedItemIds(new Set());
    setNetPayById(initialNetPayRef.current ?? {});
  }, [selectedId]);

  const payBody = useMemo(
    () =>
      buildPayablePayRequest({
        payable: detail,
        originToken,
        payer: connectedAddress,
        organizationId: orgId,
        timezone,
        notifyEnabled,
        selectedItemIds: [...selectedItemIds],
        netPayById,
      }),
    [
      detail,
      originToken,
      connectedAddress,
      orgId,
      timezone,
      notifyEnabled,
      selectedItemIds,
      netPayById,
    ],
  );

  const batchQuery = usePayablePayQuery(payBody);
  const batch = payBody ? batchQuery.data : undefined;
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

  const quoteStale = Boolean(payBody) && (
    batchQuery.isPlaceholderData
    || (batchQuery.isPending && batchQuery.isFetching)
  );
  const quoteError = batchQuery.isError
    ? formatQuoteErrorMessage(batchQuery.error, 2)
    : null;
  const quoting = Boolean(payBody) && (quoteStale || batchQuery.isFetching) && !quoteError;
  const youPayQuoted = Boolean(batch?.totalSourceAmount);
  const youPayAmount = youPayQuoted
    ? formatAmount(batch!.totalSourceAmount, { prefix: "", maxDecimals: 6 })
    : "0";
  const estCostLabel = youPayQuoted && originToken
    ? `${formatAmount(batch!.totalSourceAmount, { prefix: "", maxDecimals: 6 })} ${originToken.symbol}`
    : "-";
  const totalValuedLabel = detail
    ? formatAmount(sumPayableVolume(detail), { maxDecimals: AMOUNT_MAX_DECIMALS })
    : "$0";
  const emailCount = detail?.items.length ?? 0;

  const settleMutation = useMutation({
    mutationFn: async () => {
      if (!originToken || !payBody || !batch || !connectedAddress) {
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
          void refetchBatch();
          throw new BalanceGateError(INSUFFICIENT_APPROVAL_REQUOTE_MESSAGE);
        }
        throw error;
      }
      enqueueBatchPayoutCommit({
        quoteId: batch.quoteId,
        txHash,
        title: detail?.title ?? "",
        type: detail?.type ?? "",
      });
    },
    onSuccess: () => {
      setPhase("done");
      void queryClient.removeQueries({ queryKey: [...queryKeys.payable.all, "pay"] });
      if (!formLocked) setPickedId("");
      setDetailsOpen(false);
      setNotifyOpen(false);
      setNetPayById({});
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
    && payBody
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

  return (
    <>
      <div>
        <p className="font-montserrat text-sm font-medium text-[#606060]">Form</p>
        <div className="mt-2">
          <PaymentFormSelect
            forms={lockedForms}
            value={selectedId}
            onChange={(id) => {
              if (formLocked) return;
              setPickedId(id);
            }}
            disabled={formLocked}
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
          walletIcon={originKind === "evm" ? paymentWallet.walletInfo.icon : wallet.account?.icon}
          connecting={wallet.isConnecting}
          onConnectWallet={() => paymentWallet.connectWallet()}
          onDisconnectWallet={() => paymentWallet.disconnect()}
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
        disabled={!formSelected || (formPicked && (formsFetching || quoting || sending))}
        onEnabledChange={handleNotifyEnabled}
      >
        <button
          type="button"
          className="inline-flex items-center gap-[7px] text-[#06F]"
          onClick={() => {
            if ((formPicked && (formsFetching || quoting || sending))) {
              return;
            }
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

      <Button
        size="xl"
        className="mt-8 w-full"
        loading={formPicked && (formsFetching || quoting || sending)}
        disabled={!canSend}
        onClick={handleSend}
      >
        {formPicked ? "Send Payment" : "Select Category"}
      </Button>

      <PaymentFormDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        detail={detail}
        netPayById={netPayById}
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
