import { useEffect, useRef, useState } from "react";
import { IconQuestion } from "@/components/icons/question";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import { InputNumber } from "@/components/ui/input-number/InputNumber";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { TokenSelectDialog } from "@/components/token-select-dialog/TokenSelectDialog";
import {
  useCreatePayRequestMutation,
  usePaymentRequestDefaultAddressesQuery,
} from "@/hooks/use-request-payment";
import { useConnectedWallets } from "@/hooks/use-wallet";
import useToast from "@/hooks/use-toast";
import { organizationId } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import { useIntentsTokensStore, type IntentsToken } from "@/stores/intents-tokens";
import { getAddressPlaceholder } from "@/utils";
import { TokenSelectButton } from "./components/TokenSelectButton";
import { GenerateLinkDialog } from "./components/request/GenerateLinkDialog";
import { ReceivingAddressField } from "./components/request/ReceivingAddressField";
import {
  AMOUNT_MAX_DECIMALS,
  DESCRIPTION_MAX_LENGTH,
  PAYMENT_NAME_MAX_LENGTH,
} from "./config";
import {
  buildPaymentRequestUrl,
  defaultAddressForNetwork,
  receivingAddressError,
  tokenChainKind,
} from "./request-utils";
import { detectAddressChainKind, formatQuoteErrorMessage, parsePositiveDecimal } from "./utils";

const FIELD_CLASS =
  "mt-2 h-9 w-full rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-3 font-montserrat text-sm font-medium text-black outline-none placeholder:text-black/30";

export function RequestPaymentView() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  const createMutation = useCreatePayRequestMutation();
  const defaultsQuery = usePaymentRequestDefaultAddressesQuery();
  const owners = useConnectedWallets();
  const ensureFresh = useIntentsTokensStore((s) => s.ensureFresh);

  const [addressInput, setAddressInput] = useState("");
  const [amount, setAmount] = useState("");
  const [destToken, setDestToken] = useState<IntentsToken | null>(null);
  const [destDialogOpen, setDestDialogOpen] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [description, setDescription] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [showAddressErrors, setShowAddressErrors] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");
  const skipAutofillRef = useRef(false);
  const addressRef = useRef(addressInput);
  addressRef.current = addressInput;

  const destKind = tokenChainKind(destToken);
  const destLockChainKind = detectAddressChainKind(addressInput);
  const defaultAddresses = defaultsQuery.data ?? [];

  useEffect(() => {
    void ensureFresh();
  }, [ensureFresh]);

  useEffect(() => {
    skipAutofillRef.current = false;
    const current = addressRef.current.trim();
    if (!destKind) return;
    if (current && receivingAddressError(current, destKind)) {
      setAddressInput("");
    }
  }, [destToken?.assetId, destKind]);

  useEffect(() => {
    if (skipAutofillRef.current) return;
    if (addressInput.trim() || !destKind) return;
    const saved = defaultAddressForNetwork(defaultAddresses, destToken?.blockchain);
    if (saved) {
      setAddressInput(saved);
      return;
    }
    const connected = owners[destKind];
    if (connected) setAddressInput(connected);
  }, [addressInput, destKind, destToken?.blockchain, owners, defaultAddresses]);

  const addressError = receivingAddressError(addressInput, destKind);
  const showAddressStatus = Boolean(addressInput.trim()) || showAddressErrors;
  const amountForLink = parsePositiveDecimal(amount, AMOUNT_MAX_DECIMALS);

  function handleAddressChange(value: string) {
    skipAutofillRef.current = true;
    setAddressInput(value);
  }

  async function handleGenerate() {
    setShowAddressErrors(true);
    if (orgId === null) {
      toast.fail({ title: "Organization is missing" });
      return;
    }
    if (!destToken || !destKind) {
      toast.fail({ title: "Select a receiving token" });
      return;
    }
    if (!amountForLink) {
      toast.fail({ title: "Enter a receiving amount" });
      return;
    }
    const name = purpose.trim();
    if (!name) {
      toast.fail({ title: "Enter a request reason" });
      return;
    }
    const error = receivingAddressError(addressInput, destKind);
    if (error) {
      toast.fail({ title: error === "Address cannot be empty" ? "Fix the receiving address" : error });
      return;
    }

    try {
      const memo = description.trim();
      const created = await createMutation.mutateAsync({
        amount: amountForLink,
        description: memo || undefined,
        network: destToken.blockchain,
        organizationId: orgId,
        purpose: name,
        recipient: addressInput.trim(),
        symbol: destToken.symbol,
        setDefaultAddress: saveAsDefault,
      });
      setPaymentLink(buildPaymentRequestUrl(window.location.origin, created.batchId));
      setLinkDialogOpen(true);
    } catch (err) {
      toast.fail({ title: formatQuoteErrorMessage(err, destToken.decimals) });
    }
  }

  return (
    <>
      <div className="flex w-full flex-col items-center">
        <h2 className="font-montserrat text-xl font-medium text-black">Request Payment</h2>
        <Card className="mt-6 w-full max-w-[600px] px-[30px] py-8">
          <div className="flex items-center gap-1">
            <p className="font-montserrat text-sm font-medium text-[#606060]">Request for</p>
            <Tooltip content="Short name the payer sees on the request.">
              <IconQuestion className="size-3.5 shrink-0 text-[#606060]" />
            </Tooltip>
          </div>
          <input
            value={purpose}
            maxLength={PAYMENT_NAME_MAX_LENGTH}
            onChange={(event) => setPurpose(event.target.value.slice(0, PAYMENT_NAME_MAX_LENGTH))}
            className={FIELD_CLASS}
          />

          <div className="mt-6 flex items-center gap-2">
            <p className="font-montserrat text-sm font-medium capitalize text-[#606060]">
              Description
            </p>
            <p className="font-montserrat text-sm font-medium capitalize text-[#aaa]">
              Optional
            </p>
          </div>
          <input
            value={description}
            maxLength={DESCRIPTION_MAX_LENGTH}
            onChange={(event) => setDescription(event.target.value.slice(0, DESCRIPTION_MAX_LENGTH))}
            placeholder="e.g. detail of invoice or attachment link"
            className={FIELD_CLASS}
          />

          <p className="mt-6 font-montserrat text-sm font-medium capitalize text-[#606060]">
            Payment setting
          </p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <InputNumber
              value={amount}
              decimals={AMOUNT_MAX_DECIMALS}
              onNumberChange={setAmount}
              placeholder="0"
              className="min-w-0 flex-1 bg-transparent font-montserrat text-[26px] font-medium text-black outline-none"
            />
            <TokenSelectButton token={destToken} onClick={() => setDestDialogOpen(true)} />
          </div>
          <div className="mt-4 h-px w-full bg-[#e3e3e3]" />

          <div className="mt-6">
            <ReceivingAddressField
              value={addressInput}
              onChange={handleAddressChange}
              error={addressError}
              showStatus={showAddressStatus}
              placeholder={getAddressPlaceholder(destKind)}
              saveAsDefault={saveAsDefault}
              onSaveAsDefaultChange={setSaveAsDefault}
            />
          </div>

          <Button
            size="xl"
            className="mt-8 w-full"
            loading={createMutation.isPending}
            onClick={() => {
              void handleGenerate();
            }}
          >
            Generate Payment Request
          </Button>
        </Card>
      </div>

      <TokenSelectDialog
        open={destDialogOpen}
        onClose={() => setDestDialogOpen(false)}
        title="Receiving token"
        selectedAssetId={destToken?.assetId}
        lockChainKind={destLockChainKind}
        onSelect={({ token }) => setDestToken(token)}
      />

      <GenerateLinkDialog
        open={linkDialogOpen}
        url={paymentLink}
        onClose={() => setLinkDialogOpen(false)}
      />
    </>
  );
}
