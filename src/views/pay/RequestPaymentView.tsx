import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import { InputNumber } from "@/components/ui/input-number/InputNumber";
import { TokenNetworkDialog } from "@/components/token-network-dialog/TokenNetworkDialog";
import { WalletConnectDialog } from "@/components/WalletConnect";
import { useRequestPayment } from "@/hooks/use-request-payment";
import { useRequestWithdraw } from "@/hooks/use-request-withdraw";
import { useConnectedWallets, useWallet } from "@/hooks/use-wallet";
import useToast from "@/hooks/use-toast";
import { activateConfidentialAccount } from "@/lib/confidential/activate";
import { toIntentsAccountId } from "@/lib/confidential/to-intents-account-id";
import { hasUsableNearintentsUserSession } from "@/stores/nearintents-user-session";
import { useAuthStore } from "@/stores/auth";
import { useIntentsTokensStore, type IntentsToken } from "@/stores/intents-tokens";
import { useWalletStore } from "@/stores/wallet";
import { getAddressPlaceholder, sameAddress } from "@/utils";
import type { ChainKind } from "@/wallet";
import type { ReceivedPayment } from "@/mocks/request-payment";
import { RECEIVED_STATUS } from "@/mocks/request-payment";
import { TokenSelectButton } from "./components/TokenSelectButton";
import { AdvanceOption } from "./components/request/AdvanceOption";
import { GenerateLinkDialog } from "./components/request/GenerateLinkDialog";
import { ReceivedPaymentList } from "./components/request/ReceivedPaymentList";
import { ReceivingAddressField } from "./components/request/ReceivingAddressField";
import { AMOUNT_MAX_DECIMALS } from "./config";
import {
  activateErrorMessage,
  buildPaymentRequestUrl,
  receivingAddressError,
  tokenChainKind,
} from "./request-utils";
import { formatQuoteErrorMessage, parsePositiveDecimal } from "./utils";

export function RequestPaymentView() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const { received, pendingWithdrawCount } = useRequestPayment();
  const withdrawMutation = useRequestWithdraw();
  const owners = useConnectedWallets();
  const ensureFresh = useIntentsTokensStore((s) => s.ensureFresh);
  const findByChainAndSymbol = useIntentsTokensStore((s) => s.findByChainAndSymbol);

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
  const [paymentLink, setPaymentLink] = useState("");
  const [withdrawnIds, setWithdrawnIds] = useState<string[]>([]);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const skipAutofillRef = useRef(false);
  const pendingPrivateRef = useRef(false);
  const pendingWithdrawRef = useRef<ReceivedPayment | null>(null);
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

  const rows = useMemo(() => {
    return received.map((row) => (
      withdrawnIds.includes(row.id) ? { ...row, status: RECEIVED_STATUS.Withdrawed } : row
    ));
  }, [received, withdrawnIds]);

  const pendingCount = Math.max(0, pendingWithdrawCount - withdrawnIds.length);

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
        if (hasUsableNearintentsUserSession(intentsAccountId)) {
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
    if (!user?.id) {
      toast.fail({ title: "Sign in to generate a payment link" });
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
    const error = receivingAddressError(addressInput, destKind);
    if (error) {
      toast.fail({ title: error === "Address cannot be empty" ? "Fix the receiving address" : error });
      return;
    }

    setPaymentLink(buildPaymentRequestUrl(window.location.origin, {
      address: addressInput,
      amount: amountForLink,
      token: destToken.symbol,
      network: destToken.blockchain,
      uid: user.id,
      memo: description,
      receivePrivately,
    }));
    setLinkDialogOpen(true);
  }

  async function runWithdraw(row: ReceivedPayment) {
    const token = findByChainAndSymbol(row.blockchain, row.symbol);
    if (!token) {
      toast.fail({ title: "Could not resolve the received token" });
      return;
    }
    setWithdrawingId(row.id);
    try {
      const connectedAddress = owners[row.chainKind];
      if (!connectedAddress || !sameAddress(connectedAddress, row.address, row.chainKind)) {
        pendingWithdrawRef.current = row;
        setWalletDialogOpen(true);
        toast.info({ title: "Connect the receiving wallet to withdraw." });
        return;
      }
      await withdrawMutation.mutateAsync({
        address: row.address,
        chainKind: row.chainKind,
        assetId: token.assetId,
        amount: row.amount,
        decimals: token.decimals,
        signGeneratedIntent: (intent) => useWalletStore.getState().signGeneratedIntent(row.chainKind, intent),
      });
      setWithdrawnIds((ids) => (ids.includes(row.id) ? ids : [...ids, row.id]));
      toast.success({ title: "Withdraw submitted" });
    } catch (error) {
      toast.fail({ title: formatQuoteErrorMessage(error, token.decimals) });
    } finally {
      if (pendingWithdrawRef.current?.id !== row.id) {
        setWithdrawingId(null);
      }
    }
  }

  useEffect(() => {
    const row = pendingWithdrawRef.current;
    if (!row) return;
    const connectedAddress = owners[row.chainKind];
    if (!connectedAddress || !sameAddress(connectedAddress, row.address, row.chainKind)) return;
    pendingWithdrawRef.current = null;
    void runWithdraw(row);
  }, [owners]);

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
            rows={rows}
            pendingWithdrawCount={pendingCount}
            withdrawingId={withdrawingId}
            onWithdraw={(row) => {
              void runWithdraw(row);
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

      <GenerateLinkDialog
        open={linkDialogOpen}
        url={paymentLink}
        onClose={() => setLinkDialogOpen(false)}
      />

      {walletDialogOpen ? (
        <WalletConnectDialog
          preferredKind={(pendingWithdrawRef.current?.chainKind ?? destKind ?? "evm") as ChainKind}
          title="Receiving wallet"
          description="Connect the wallet that matches the receiving address."
          onClose={() => {
            pendingPrivateRef.current = false;
            pendingWithdrawRef.current = null;
            setWithdrawingId(null);
            setWalletDialogOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
