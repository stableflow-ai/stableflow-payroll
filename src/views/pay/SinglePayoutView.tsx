import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconLock } from "@/components/icons/lock";
import { IconQuestion } from "@/components/icons/question";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import { InputNumber } from "@/components/ui/input-number/InputNumber";
import { Switch } from "@/components/ui/switch/Switch";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { TokenNetworkDialog } from "@/components/token-network-dialog/TokenNetworkDialog";
import { WalletConnectDialog } from "@/components/WalletConnect";
import { queryKeys } from "@/api/query-keys";
import { useContacts, type Contact } from "@/hooks/use-contacts";
import { usePayOriginToken } from "@/hooks/use-pay-origin-token";
import { usePaymentWallet } from "@/hooks/use-payment-wallet";
import { useSinglePayQuote, useSinglePaySwap } from "@/hooks/use-single-payout-api";
import { useTokenBalancesStore } from "@/stores/token-balances";
import useToast from "@/hooks/use-toast";
import { formatAmount, sameAddress } from "@/utils";
import type { PaySingleQuoteParam, PaySingleSwapParam } from "@/types/payout";
import { enqueueQuickPayCommit } from "@/stores/quick-pay-commit-queue";
import { useIntentsTokensStore, type IntentsToken } from "@/stores/intents-tokens";
import { broadcastQuickPayCallData } from "@/wallet/broadcast-quick-pay";
import type { ChainKind } from "@/wallet";
import { ContactFormDialog } from "./components/ContactFormDialog";
import { DeleteContactDialog } from "./components/DeleteContactDialog";
import { RecipientAddressField } from "./components/RecipientAddressField";
import { RecipientsDialog } from "./components/RecipientsDialog";
import { TokenSelectButton } from "./components/TokenSelectButton";
import { YouPaySection } from "./components/YouPaySection";
import {
  AMOUNT_MAX_DECIMALS,
  EMAIL_MAX_LENGTH,
  MEMO_MAX_LENGTH,
  QUICK_PAY_SLIPPAGE_TOLERANCE,
  QUOTE_DEBOUNCE_MS,
} from "./config";
import {
  applyRequestPayoutFields,
  parsePaymentRequestSearch,
  tokenChainKind,
} from "./request-utils";
import {
  detectAddressChainKind,
  formatQuoteErrorMessage,
  isDryQuoteStale,
  notifyEmailParam,
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

function matchContact(address: string, contacts: Contact[]): Contact | null {
  const kind = detectAddressChainKind(address);
  if (!kind) return null;
  return contacts.find((row) => sameAddress(row.wallet, address, kind)) ?? null;
}

export function SinglePayoutView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const request = useMemo(() => parsePaymentRequestSearch(searchParams.toString()), [searchParams]);
  const requestLocked = Boolean(request);
  const queryClient = useQueryClient();
  const toast = useToast();
  const { contacts, addContact, updateContact, deleteContact } = useContacts();
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

  const [addressInput, setAddressInput] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [notify, setNotify] = useState(false);
  const [email, setEmail] = useState("");
  const [destToken, setDestToken] = useState<IntentsToken | null>(null);
  const [destDialogOpen, setDestDialogOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "quoting" | "sending" | "done" | "error">("idle");
  const appliedRequestKeyRef = useRef<string | null>(null);
  const invalidLinkToastRef = useRef(false);

  useEffect(() => {
    void ensureFresh();
  }, [ensureFresh]);

  useEffect(() => {
    if (!searchParams.toString() || request || invalidLinkToastRef.current) return;
    invalidLinkToastRef.current = true;
    toast.fail({ title: "This payment link is invalid" });
  }, [request, searchParams, toast]);

  useEffect(() => {
    if (!request) return;
    const key = searchParams.toString();
    if (appliedRequestKeyRef.current === key) return;
    appliedRequestKeyRef.current = key;
    setAddressInput(request.addr);
    setAmount(request.amount);
    if (request.memo) setMemo(request.memo);
  }, [request, searchParams]);

  useEffect(() => {
    if (!request) return;
    const next = findByChainAndSymbol(request.network, request.token);
    if (next) setDestToken(next);
  }, [findByChainAndSymbol, request, tokens]);

  const matched = useMemo(() => matchContact(addressInput, contacts), [addressInput, contacts]);
  const destLockChainKind = detectAddressChainKind(addressInput);
  const destinationAddress = destLockChainKind ? addressInput.trim() : "";
  const amountForQuote = parsePositiveDecimal(amount, AMOUNT_MAX_DECIMALS);
  const debouncedAmountForQuote = useDebouncedValue(amountForQuote, QUOTE_DEBOUNCE_MS);

  useEffect(() => {
    if (matched?.email) {
      setEmail(matched.email.slice(0, EMAIL_MAX_LENGTH));
      setNotify(true);
    }
  }, [matched?.id, matched?.email]);

  useEffect(() => {
    if (requestLocked) return;
    if (!destToken || !destLockChainKind) return;
    if (destToken.chain.chainKind !== destLockChainKind) setDestToken(null);
  }, [destLockChainKind, destToken, requestLocked]);

  useEffect(() => {
    if (requestLocked || destToken || !destLockChainKind || tokens.length === 0) return;
    const next =
      tokens.find((token) => token.symbol === "USDT" && token.chain.chainKind === destLockChainKind)
      || tokens.find((token) => token.symbol === "USDC" && token.chain.chainKind === destLockChainKind);
    if (next) setDestToken(next);
  }, [destLockChainKind, destToken, requestLocked, tokens]);

  const canQuoteDestination = Boolean(destinationAddress && destToken);

  const quoteBody = useMemo((): PaySingleQuoteParam | null => {
    if (!originToken || !destToken || !debouncedAmountForQuote || !canQuoteDestination || !walletReady || !connectedAddress) {
      return null;
    }
    const origin = payoutNetworkToken(originToken);
    const dest = payoutNetworkToken(destToken);
    const destKind = tokenChainKind(destToken);
    const body: PaySingleQuoteParam = {
      amount: debouncedAmountForQuote,
      destinationAddress,
      destinationNetwork: dest.network,
      destinationToken: dest.token,
      network: origin.network,
      token: origin.token,
      refundTo: connectedAddress,
      slippageTolerance: QUICK_PAY_SLIPPAGE_TOLERANCE,
      payer: connectedAddress,
    };
    if (!request || !destKind) return body;
    try {
      return applyRequestPayoutFields(body, request, destKind);
    } catch {
      return null;
    }
  }, [
    originToken,
    destToken,
    debouncedAmountForQuote,
    canQuoteDestination,
    walletReady,
    connectedAddress,
    destinationAddress,
    request,
  ]);

  const dryQuoteQuery = useSinglePayQuote(quoteBody);
  const swapMutation = useSinglePaySwap();
  const quote = amountForQuote && canQuoteDestination ? dryQuoteQuery.data : undefined;
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

  function resetForm() {
    setAddressInput("");
    setDestToken(null);
    setAmount("");
    setMemo("");
    setNotify(false);
    setEmail("");
    void queryClient.removeQueries({ queryKey: queryKeys.payout.all });
  }

  const settleMutation = useMutation({
    mutationFn: async () => {
      if (!originToken || !destToken || !amountForQuote || !quote || !destinationAddress || !connectedAddress) {
        throw new Error("Missing payment inputs");
      }
      if (!wallet.isConnected || !wallet.account?.address) {
        setWalletDialogOpen(true);
        throw new Error("Connect your payment wallet first");
      }
      if (originToken.chain.chainKind !== "evm" || !originToken.chain.chainId || !originToken.contractAddress) {
        // TODO: broadcast Near / Solana / Tron origin payouts when the backend supports them.
        toast.fail({ title: "Quick Pay currently supports EVM origin tokens only" });
        throw new BalanceGateError("Unsupported origin chain");
      }
      const paymentWalletAddress = wallet.account.address;
      setPhase("quoting");
      const origin = payoutNetworkToken(originToken);
      const dest = payoutNetworkToken(destToken);
      const destKind = tokenChainKind(destToken);
      let swapBody: PaySingleSwapParam = {
        amount: amountForQuote,
        destinationAddress,
        destinationNetwork: dest.network,
        destinationToken: dest.token,
        network: origin.network,
        token: origin.token,
        refundTo: paymentWalletAddress,
        slippageTolerance: QUICK_PAY_SLIPPAGE_TOLERANCE,
        payer: paymentWalletAddress,
        notifyEmail: notifyEmailParam(notify, email),
      };
      if (request && destKind) {
        swapBody = applyRequestPayoutFields(swapBody, request, destKind);
      }
      const memoValue = memo.trim();
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
      toast.success({ title: "Payment submitted" });
      if (requestLocked) {
        appliedRequestKeyRef.current = null;
        setSearchParams({}, { replace: true });
      }
      resetForm();
      window.setTimeout(() => setPhase("idle"), 1500);
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
  const quoteLoading = Boolean(amountForQuote && canQuoteDestination && originToken && walletReady)
    && (dryQuoteStale || dryQuoteQuery.isFetching);
  const canSend = Boolean(
    destinationAddress
    && destToken
    && amountForQuote
    && originToken
    && quote
    && !dryQuoteStale
    && !quoteError
    && !sending,
  );

  function handleSend() {
    if (!connectedAddress) {
      setWalletDialogOpen(true);
      return;
    }
    void settleMutation.mutateAsync();
  }

  return (
    <>
      <Card className="w-full max-w-[776px] px-6 py-7 sm:px-8">
        <RecipientAddressField
          value={addressInput}
          matched={matched}
          locked={requestLocked}
          onChange={setAddressInput}
          onClear={() => {
            setAddressInput("");
            setDestToken(null);
          }}
          onOpenBook={() => setBookOpen(true)}
        />

        <div className="mt-8">
          <p className="font-montserrat text-sm font-medium text-[#606060]">Amount</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <InputNumber
              value={amount}
              decimals={AMOUNT_MAX_DECIMALS}
              onNumberChange={setAmount}
              placeholder="0"
              readOnly={requestLocked}
              className="min-w-0 flex-1 bg-transparent font-montserrat text-[26px] font-medium text-black outline-none"
            />
            <TokenSelectButton
              token={destToken}
              disabled={requestLocked}
              onClick={() => {
                if (!requestLocked) setDestDialogOpen(true);
              }}
            />
          </div>
          <div className="mt-4 h-px w-full bg-[#e3e3e3]" />
        </div>

        <div className="mt-5">
          <YouPaySection
            amountDisplay={amountInDisplay}
            originToken={originToken}
            onOriginTokenChange={setOriginToken}
            walletAddress={connectedAddress}
            walletConnected={wallet.isConnected}
            walletIcon={originKind === "evm" ? paymentWallet.walletInfo.icon : null}
            connecting={wallet.isConnecting}
            onConnectWallet={() => setWalletDialogOpen(true)}
          />
          <div className="mt-4 h-px w-full bg-[#e3e3e3]" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="font-montserrat text-xs text-[#70788a]">Est. Cost -</span>
          <span className="inline-flex h-[26px] items-center gap-1.5 rounded-[13px] border border-[#d0f348] bg-[rgba(208,243,72,0.2)] px-2.5 font-montserrat text-xs font-medium text-[#84a20f]">
            <IconLock className="size-3" />
            Private by default
          </span>
        </div>
        {quoteError ? (
          <p className="mt-2 font-montserrat text-xs text-danger">{quoteError}</p>
        ) : null}

        <div className="mt-6 flex items-center gap-3">
          <span className="inline-flex shrink-0 items-center gap-1 font-montserrat text-sm font-medium text-[#606060]">
            Memo
            <Tooltip content="The memo will be displayed in the history, visible only to you">
              <IconQuestion className="size-3.5 text-[#606060]" />
            </Tooltip>
          </span>
          <input
            value={memo}
            maxLength={MEMO_MAX_LENGTH}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="Intention of transfer"
            className="h-9 min-w-0 flex-1 rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-3 font-montserrat text-sm text-black outline-none placeholder:text-black/30"
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="inline-flex shrink-0 items-center gap-2 font-montserrat text-sm font-medium text-[#606060]">
            Notify Recipient
            <Switch
              checked={notify}
              onCheckedChange={(checked) => {
                setNotify(checked);
                if (!checked) setEmail("");
              }}
              aria-label="Notify recipient"
            />
          </span>
          <input
            type="email"
            value={email}
            maxLength={EMAIL_MAX_LENGTH}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@example.com"
            className="h-9 min-w-0 flex-1 rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-3 font-montserrat text-sm text-black outline-none placeholder:text-black/30"
          />
        </div>

        <Button
          size="xl"
          className="mt-8 w-full"
          loading={sending || quoteLoading}
          disabled={!canSend && Boolean(connectedAddress)}
          onClick={handleSend}
        >
          Send Payment
        </Button>
      </Card>

      <TokenNetworkDialog
        open={destDialogOpen}
        onClose={() => setDestDialogOpen(false)}
        title="Recipient token"
        initialSymbol={(destToken?.symbol || "USDC") as "USDC" | "USDT"}
        selectedAssetId={destToken?.assetId}
        lockChainKind={destLockChainKind}
        onSelect={({ token }) => setDestToken(token)}
      />

      <RecipientsDialog
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        contacts={contacts}
        selectedAddress={addressInput}
        onSelect={(contact) => {
          setAddressInput(contact.wallet);
          if (contact.email) {
            setEmail(contact.email.slice(0, EMAIL_MAX_LENGTH));
            setNotify(true);
          }
          setBookOpen(false);
        }}
        onAdd={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        onEdit={(contact) => {
          setEditing(contact);
          setFormOpen(true);
        }}
        onDelete={(contact) => setDeleting(contact)}
      />

      <ContactFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        contact={editing}
        onSave={(input) => {
          const save = editing ? updateContact(editing.id, input) : addContact(input);
          void save.catch((error) => {
            toast.fail({
              title: error instanceof Error ? error.message : "Failed to save recipient",
            });
          });
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <DeleteContactDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        contact={deleting}
        onConfirm={() => {
          if (deleting) {
            void deleteContact(deleting.id).catch((error) => {
              toast.fail({
                title: error instanceof Error ? error.message : "Failed to delete recipient",
              });
            });
          }
          setDeleting(null);
        }}
      />

      {walletDialogOpen ? <WalletConnectDialog onClose={() => setWalletDialogOpen(false)} /> : null}
    </>
  );
}
