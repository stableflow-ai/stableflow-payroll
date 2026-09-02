import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconQuestion } from "@/components/icons/question";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import { InputNumber } from "@/components/ui/input-number/InputNumber";
import { Switch } from "@/components/ui/switch/Switch";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { TokenSelectDialog } from "@/components/token-select-dialog/TokenSelectDialog";
import { queryKeys } from "@/api/query-keys";
import { useContacts, type Contact } from "@/hooks/use-contacts";
import useToast from "@/hooks/use-toast";
import { sameAddress } from "@/utils";
import { useIntentsTokensStore, type IntentsToken } from "@/stores/intents-tokens";
import { ContactFormDialog } from "./components/ContactFormDialog";
import { DeleteContactDialog } from "./components/DeleteContactDialog";
import { RecipientAddressField } from "./components/RecipientAddressField";
import { RecipientsDialog } from "./components/RecipientsDialog";
import { TokenSelectButton } from "./components/TokenSelectButton";
import {
  AMOUNT_MAX_DECIMALS,
  EMAIL_MAX_LENGTH,
  MEMO_MAX_LENGTH,
  QUICK_PAY_SLIPPAGE_TOLERANCE,
} from "./config";
import {
  detectAddressChainKind,
  defaultDestToken,
  formatQuoteErrorMessage,
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

function matchContact(address: string, contacts: Contact[]): Contact | null {
  const kind = detectAddressChainKind(address);
  if (!kind) return null;
  return contacts.find((row) => sameAddress(row.wallet, address, kind)) ?? null;
}

export function SinglePayoutView() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { contacts, addContact, updateContact, deleteContact, isPending: contactsPending } = useContacts();
  const ensureFresh = useIntentsTokensStore((s) => s.ensureFresh);
  const tokens = useIntentsTokensStore((s) => s.tokens);

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
  const [phase, setPhase] = useState<"idle" | "quoting" | "sending" | "done" | "error">("idle");

  useEffect(() => {
    void ensureFresh();
  }, [ensureFresh]);

  const matched = useMemo(() => matchContact(addressInput, contacts), [addressInput, contacts]);
  const destLockChainKind = detectAddressChainKind(addressInput);
  const destinationAddress = destLockChainKind ? addressInput.trim() : "";
  const amountDecimals = parsePositiveDecimal(amount, AMOUNT_MAX_DECIMALS);

  useEffect(() => {
    if (matched?.email) {
      setEmail(matched.email.slice(0, EMAIL_MAX_LENGTH));
      setNotify(true);
    }
  }, [matched?.id, matched?.email]);

  useEffect(() => {
    if (!destToken || !destLockChainKind) return;
    if (destToken.chain.chainKind !== destLockChainKind) setDestToken(null);
  }, [destLockChainKind, destToken]);

  useEffect(() => {
    if (destToken || !destLockChainKind || tokens.length === 0) return;
    const next = defaultDestToken(tokens, destLockChainKind);
    if (next) setDestToken(next);
  }, [destLockChainKind, destToken, tokens]);

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
      if (!destToken || !amountDecimals || !destinationAddress) {
        throw new Error("Missing payment inputs");
      }
      setPhase("quoting");
      const dest = payoutNetworkToken(destToken);
      const payBody = {
        amount: amountDecimals,
        destinationAddress,
        destinationNetwork: dest.network,
        destinationToken: dest.token,
        slippageTolerance: QUICK_PAY_SLIPPAGE_TOLERANCE,
        notifyEmail: notifyEmailParam(notify, email),
        memo: memo.trim() ? memo.trim() : void 0,
        successUrl: `${window.location.origin}/pay/success`,
      };
      console.log(payBody);
      // TODO Call the API to get the payment link
      // Redirect to the payment link
      setPhase("sending");
    },
    onSuccess: () => {
      setPhase("done");
      toast.success({ title: "Payment submitted" });
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
  const canSend = Boolean(
    destinationAddress
    && destToken
    && amountDecimals
    && !sending,
  );

  function handleSend() {
    settleMutation.mutateAsync();
  }

  return (
    <>
      <Card className="mx-auto w-full max-w-[776px] px-6 py-7 sm:px-8">
        <RecipientAddressField
          value={addressInput}
          matched={matched}
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
              className="min-w-0 flex-1 bg-transparent font-montserrat text-[26px] font-medium text-black outline-none"
            />
            <TokenSelectButton
              token={destToken}
              onClick={() => setDestDialogOpen(true)}
            />
          </div>
          <div className="mt-4 h-px w-full bg-[#e3e3e3]" />
        </div>

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
            className="min-h-9 h-9 shrink-0 min-w-0 flex-1 rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-3 font-montserrat text-sm text-black outline-none placeholder:text-black/30"
          />
        </div>

        <Button
          size="xl"
          className="mt-8 w-full"
          loading={sending}
          disabled={!canSend}
          onClick={handleSend}
        >
          Send Payment
        </Button>
      </Card>

      <TokenSelectDialog
        open={destDialogOpen}
        onClose={() => setDestDialogOpen(false)}
        title="Recipient token"
        selectedAssetId={destToken?.assetId}
        lockChainKind={destLockChainKind}
        onSelect={({ token }) => setDestToken(token)}
      />

      <RecipientsDialog
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        contacts={contacts}
        loading={contactsPending}
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
    </>
  );
}
