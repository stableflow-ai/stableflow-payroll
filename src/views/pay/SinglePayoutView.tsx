import { useEffect, useMemo, useState } from "react";
import { IconQuestion } from "@/components/icons/question";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import { InputNumber } from "@/components/ui/input-number/InputNumber";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { TokenSelectDialog } from "@/components/token-select-dialog/TokenSelectDialog";
import { useCreatePayrollPaymentMutation } from "@/hooks/use-single-payout-api";
import { useContacts, type Contact } from "@/hooks/use-contacts";
import useToast from "@/hooks/use-toast";
import { sameAddress } from "@/utils";
import { useIntentsTokensStore, type IntentsToken } from "@/stores/intents-tokens";
import { ContactFormDialog } from "./components/ContactFormDialog";
import { DeleteContactDialog } from "./components/DeleteContactDialog";
import { RecipientAddressField } from "./components/RecipientAddressField";
import { RecipientsDialog } from "./components/RecipientsDialog";
import { TokenSelectButton } from "./components/TokenSelectButton";
import { AMOUNT_MAX_DECIMALS, MEMO_MAX_LENGTH, PAYOUT_RESULT_PATH } from "./config";
import {
  detectAddressChainKind,
  defaultDestToken,
  parsePositiveDecimal,
  payoutNetworkToken,
} from "./utils";

function matchContact(address: string, contacts: Contact[]): Contact | null {
  const kind = detectAddressChainKind(address);
  if (!kind) return null;
  return contacts.find((row) => sameAddress(row.wallet, address, kind)) ?? null;
}

export function SinglePayoutView() {
  const toast = useToast();
  const { contacts, addContact, updateContact, deleteContact, isPending: contactsPending } = useContacts();
  const ensureFresh = useIntentsTokensStore((s) => s.ensureFresh);
  const tokens = useIntentsTokensStore((s) => s.tokens);
  const createPayment = useCreatePayrollPaymentMutation();

  const [addressInput, setAddressInput] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [destToken, setDestToken] = useState<IntentsToken | null>(null);
  const [destDialogOpen, setDestDialogOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  /** Stays true while the browser navigates to the hosted checkout. */
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    void ensureFresh();
  }, [ensureFresh]);

  const matched = useMemo(() => matchContact(addressInput, contacts), [addressInput, contacts]);
  const destLockChainKind = detectAddressChainKind(addressInput);
  const destinationAddress = destLockChainKind ? addressInput.trim() : "";
  const amountDecimals = parsePositiveDecimal(amount, AMOUNT_MAX_DECIMALS);

  useEffect(() => {
    if (!destToken || !destLockChainKind) return;
    if (destToken.chain.chainKind !== destLockChainKind) setDestToken(null);
  }, [destLockChainKind, destToken]);

  useEffect(() => {
    if (destToken || !destLockChainKind || tokens.length === 0) return;
    const next = defaultDestToken(tokens, destLockChainKind);
    if (next) setDestToken(next);
  }, [destLockChainKind, destToken, tokens]);

  const sending = createPayment.isPending || redirecting;
  const canSend = Boolean(
    destinationAddress
    && destToken
    && amountDecimals
    && !sending,
  );

  async function handleSend() {
    if (!destToken || !amountDecimals || !destinationAddress) return;
    const dest = payoutNetworkToken(destToken);
    try {
      const payment = await createPayment.mutateAsync({
        amount: amountDecimals,
        network: dest.network,
        symbol: dest.token,
        recipient: destinationAddress,
        memo: memo.trim() || undefined,
        success_url: `${window.location.origin}${PAYOUT_RESULT_PATH}`,
      });
      setRedirecting(true);
      window.location.assign(payment.payUrl);
    } catch (cause) {
      toast.fail({
        title: cause instanceof Error && cause.message
          ? cause.message
          : "Unable to create the payment",
      });
    }
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

        <Button
          size="xl"
          className="mt-8 w-full"
          loading={sending}
          disabled={!canSend}
          onClick={() => void handleSend()}
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
