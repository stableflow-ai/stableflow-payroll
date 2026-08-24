import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import { InputNumber } from "@/components/ui/input-number/InputNumber";
import { TokenNetworkDialog } from "@/components/token-network-dialog/TokenNetworkDialog";
import { WalletConnectDialog } from "@/components/WalletConnect";
import { useRequestPayment } from "@/hooks/use-request-payment";
import { useConnectedWallets, useWallet } from "@/hooks/use-wallet";
import useToast from "@/hooks/use-toast";
import { activateConfidentialAccount } from "@/lib/confidential/activate";
import { toIntentsAccountId } from "@/lib/confidential/to-intents-account-id";
import { hasUsableSession } from "@/lib/confidential/session";
import { useIntentsTokensStore, type IntentsToken } from "@/stores/intents-tokens";
import { getAddressPlaceholder, sameAddress } from "@/utils";
import type { ChainKind } from "@/wallet";
import { TokenSelectButton } from "./components/TokenSelectButton";
import { AdvanceOption } from "./components/request/AdvanceOption";
import { GenerateLinkDialog } from "./components/request/GenerateLinkDialog";
import { ReceivedPaymentList } from "./components/request/ReceivedPaymentList";
import { ReceivingAddressField } from "./components/request/ReceivingAddressField";
import { AMOUNT_MAX_DECIMALS } from "./config";
import {
  activateErrorMessage,
  buildRequestPaymentPayload,
  receivingAddressError,
  tokenChainKind,
} from "./request-utils";
import { parsePositiveDecimal } from "./utils";

export function RequestPaymentView() {
  const toast = useToast();
  const { received, pendingWithdrawCount } = useRequestPayment();
  const owners = useConnectedWallets();
  const ensureFresh = useIntentsTokensStore((s) => s.ensureFresh);

  const [addressInput, setAddressInput] = useState("");
  const [amount, setAmount] = useState("");
  const [destToken, setDestToken] = useState<IntentsToken | null>(null);
  const [destDialogOpen, setDestDialogOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [receivePrivately, setReceivePrivately] = useState(false);
  const [activating, setActivating] = useState(false);
  const [showAddressErrors, setShowAddressErrors] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const skipAutofillRef = useRef(false);
  const pendingPrivateRef = useRef(false);
  const addressRef = useRef(addressInput);
  const activateRef = useRef<() => Promise<boolean>>(async () => false);
  addressRef.current = addressInput;

  const destKind = tokenChainKind(destToken);
  const wallet = useWallet(destKind ?? "evm");

  useEffect(() => {
    void ensureFresh();
  }, [ensureFresh]);

  useEffect(() => {
    skipAutofillRef.current = false;
    const current = addressRef.current.trim();
    if (!destKind) return;
    if (current && receivingAddressError(current, destKind)) {
      setAddressInput("");
      setReceivePrivately(false);
    }
  }, [destToken?.assetId, destKind]);

  useEffect(() => {
    if (skipAutofillRef.current) return;
    if (addressInput.trim() || !destKind) return;
    const connected = owners[destKind];
    if (connected) setAddressInput(connected);
  }, [addressInput, destKind, owners]);

  const addressError = receivingAddressError(addressInput, destKind);
  const showAddressStatus = Boolean(addressInput.trim()) || showAddressErrors;
  const amountForLink = parsePositiveDecimal(amount, AMOUNT_MAX_DECIMALS);

  function clearAddress() {
    skipAutofillRef.current = true;
    pendingPrivateRef.current = false;
    setAddressInput("");
    setReceivePrivately(false);
    setShowAddressErrors(false);
  }

  async function activatePrivateReceive() {
    if (!destKind || !destToken) {
      toast.fail({ title: "Select a receiving token" });
      return false;
    }
    const error = receivingAddressError(addressInput, destKind);
    if (error) {
      setShowAddressErrors(true);
      toast.fail({ title: error === "Address cannot be empty" ? "Fix the receiving address" : error });
      return false;
    }
    const address = addressInput.trim();
    const connectedAddress = owners[destKind];
    if (!connectedAddress) {
      pendingPrivateRef.current = true;
      setWalletDialogOpen(true);
      toast.info({ title: "Connect the receiving wallet to activate private receive." });
      return false;
    }
    if (!sameAddress(connectedAddress, address, destKind)) {
      pendingPrivateRef.current = true;
      setWalletDialogOpen(true);
      toast.info({ title: "Connect the same wallet as the receiving address to activate private receive." });
      return false;
    }

    setActivating(true);
    try {
      const result = await activateConfidentialAccount({
        address,
        chainKind: destKind,
        signMessage: wallet.signMessage,
      });
      setReceivePrivately(true);
      if (result.corsFallback) {
        toast.notice({ title: "Signed locally. Session will sync when the auth endpoint is reachable." });
      } else {
        toast.success({ title: "Private receive is on" });
      }
      return true;
    } catch (error) {
      toast.fail({ title: activateErrorMessage(error, "Could not activate private receive") });
      return false;
    } finally {
      setActivating(false);
    }
  }
  activateRef.current = activatePrivateReceive;

  useEffect(() => {
    if (!pendingPrivateRef.current || !destKind) return;
    const connectedAddress = owners[destKind];
    if (!connectedAddress || !addressInput.trim()) return;
    if (!sameAddress(connectedAddress, addressInput, destKind)) return;
    pendingPrivateRef.current = false;
    void activateRef.current();
  }, [owners, destKind, addressInput]);

  function handleAddressChange(value: string) {
    skipAutofillRef.current = true;
    setAddressInput(value);
    if (receivePrivately) setReceivePrivately(false);
  }

  async function handleReceivePrivatelyChange(next: boolean) {
    if (!next) {
      pendingPrivateRef.current = false;
      setReceivePrivately(false);
      return;
    }
    if (!advanceOpen) setAdvanceOpen(true);
    if (destKind && addressInput.trim()) {
      try {
        const intentsAccountId = toIntentsAccountId(addressInput, destKind);
        if (hasUsableSession(intentsAccountId)) {
          setReceivePrivately(true);
          return;
        }
      } catch {
        // Fall through to the full activate path.
      }
    }
    await activatePrivateReceive();
  }

  function handleGenerate() {
    setShowAddressErrors(true);
    if (!destToken || !destKind) {
      toast.fail({ title: "Select a receiving token" });
      return;
    }
    if (!amountForLink) {
      toast.fail({ title: "Enter a receiving amount" });
      return;
    }
    const error = receivingAddressError(addressInput, destKind);
    if (error) {
      toast.fail({ title: error === "Address cannot be empty" ? "Fix the receiving address" : error });
      return;
    }

    // TODO(api): POST /v1/pay/request with this payload, then show the live
    // payer URL `/pay?request=:id`. Do not open Single Payout or submit a pay
    // this sprint. See src/lib/confidential/pay.ts for the payer branch.
    void buildRequestPaymentPayload({
      address: addressInput,
      amount: amountForLink,
      destinationAsset: destToken.assetId,
      description,
      receivePrivately,
    });
    setLinkDialogOpen(true);
  }

  return (
    <>
      <div className="flex w-full max-w-[776px] flex-col gap-6">
        <Card className="w-full px-6 py-7 sm:px-8">
          <ReceivingAddressField
            value={addressInput}
            onChange={handleAddressChange}
            onClear={clearAddress}
            error={addressError}
            showStatus={showAddressStatus}
            placeholder={getAddressPlaceholder(destKind)}
          />

          <div className="mt-8">
            <p className="font-montserrat text-sm font-medium text-[#606060]">
              Set receiving token amount
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
          </div>

          <AdvanceOption
            open={advanceOpen}
            onToggle={() => setAdvanceOpen((value) => !value)}
            description={description}
            onDescriptionChange={setDescription}
            receivePrivately={receivePrivately}
            privatelyLoading={activating}
            onReceivePrivatelyChange={(checked) => {
              void handleReceivePrivatelyChange(checked);
            }}
          />

          <Button size="xl" className="mt-8 w-full" loading={activating} onClick={handleGenerate}>
            Generate Payment Link
          </Button>
        </Card>

        <Card className="w-full px-6 py-7 sm:px-8">
          <ReceivedPaymentList
            rows={received}
            pendingWithdrawCount={pendingWithdrawCount}
            onWithdraw={() => {
              // TODO(api): POST /v1/pay/request/received/:id/withdraw then sign
              // the generated intent. See src/lib/confidential/withdraw.ts.
              toast.info({ title: "Withdraw is coming soon" });
            }}
          />
        </Card>
      </div>

      <TokenNetworkDialog
        open={destDialogOpen}
        onClose={() => setDestDialogOpen(false)}
        title="Receiving token"
        initialSymbol={(destToken?.symbol || "USDC") as "USDC" | "USDT"}
        selectedAssetId={destToken?.assetId}
        onSelect={({ token }) => setDestToken(token)}
      />

      <GenerateLinkDialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} />

      {walletDialogOpen ? (
        <WalletConnectDialog
          preferredKind={(destKind ?? "evm") as ChainKind}
          title="Receiving wallet"
          description="Connect the wallet that matches the receiving address to activate private receive."
          onClose={() => {
            pendingPrivateRef.current = false;
            setWalletDialogOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
