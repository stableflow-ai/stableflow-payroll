import { useEffect, useMemo, useState } from "react";
import { TokenNetworkDialog } from "@/components/token-network-dialog/TokenNetworkDialog";
import { WalletConnectDialog } from "@/components/WalletConnect";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import { PAYER_BLOCKCHAINS } from "@/config/chains";
import { useEnsureTokenBalances } from "@/hooks/use-token-balances";
import { usePayOriginToken } from "@/hooks/use-pay-origin-token";
import { useConnectedWallets } from "@/hooks/use-wallet";
import { tokenLogoUrl } from "@/lib/logo";
import { formatAmount } from "@/utils";
import { useIntentsTokensStore } from "@/stores/intents-tokens";
import { useTokenBalancesStore } from "@/stores/token-balances";
import { HOME_BALANCE_POLL_MS } from "../config";

function ownerForKind(owners: ReturnType<typeof useConnectedWallets>, kind: string) {
  if (kind === "evm" || kind === "near" || kind === "solana") return owners[kind];
  return undefined;
}

export function SummaryCard({
  totalPayment,
  recipients,
}: {
  totalPayment: string | null;
  recipients: number | null;
}) {
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const owners = useConnectedWallets();
  const hasWallet = Boolean(owners.evm || owners.near || owners.solana);
  const { setOriginToken } = usePayOriginToken();
  const ensureFresh = useIntentsTokensStore((s) => s.ensureFresh);
  const tokens = useIntentsTokensStore((s) => s.tokens);
  const getBalance = useTokenBalancesStore((s) => s.getBalance);
  const balanceEntries = useTokenBalancesStore((s) => s.balances);

  useEffect(() => {
    void ensureFresh();
  }, [ensureFresh]);

  const payerTokens = useMemo(
    () => tokens.filter((token) =>
      (token.symbol === "USDT" || token.symbol === "USDC")
      && PAYER_BLOCKCHAINS.includes(token.blockchain)
    ),
    [tokens],
  );

  useEnsureTokenBalances({
    owners,
    tokens: payerTokens,
    enabled: hasWallet && payerTokens.length > 0,
    pollMs: HOME_BALANCE_POLL_MS,
  });

  const totals = useMemo(() => {
    let usdt = 0;
    let usdc = 0;
    for (const token of payerTokens) {
      const owner = ownerForKind(owners, token.chain.chainKind);
      const formatted = getBalance(owner, token.assetId)?.formatted;
      const amount = Number(formatted);
      if (!Number.isFinite(amount)) continue;
      if (token.symbol === "USDT") usdt += amount;
      else usdc += amount;
    }
    return { usdt, usdc, usd: usdt + usdc };
  }, [payerTokens, owners, getBalance, balanceEntries]);

  return (
    <>
      <Card className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <section>
          <h2 className="font-montserrat text-base font-medium capitalize text-black">Balance</h2>
          {hasWallet ? (
            <button
              type="button"
              className="mt-2 block w-full text-left"
              onClick={() => setTokenDialogOpen(true)}
            >
              <p className="font-montserrat text-[26px] font-medium text-black">
                {formatAmount(totals.usd, { padDecimals: true })}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  { symbol: "USDT", amount: totals.usdt },
                  { symbol: "USDC", amount: totals.usdc },
                ].map((token) => (
                  <span
                    key={token.symbol}
                    className="inline-flex h-[30px] items-center gap-1.5 rounded-[18px] border border-[#E3E3E3] bg-white px-2"
                  >
                    <img
                      src={tokenLogoUrl(token.symbol)}
                      alt=""
                      className="size-[18px] rounded-full object-cover"
                    />
                    <span className="font-montserrat text-sm font-medium text-black">
                      {formatAmount(token.amount, { prefix: "", padDecimals: true })}
                    </span>
                  </span>
                ))}
              </div>
            </button>
          ) : (
            <Button
              variant="primary"
              size="md"
              className="mt-4 px-[22px]"
              onClick={() => setWalletDialogOpen(true)}
            >
              Connect Wallet
            </Button>
          )}
        </section>

        <section>
          <h2 className="font-montserrat text-base font-medium capitalize text-black">
            Total Payment
          </h2>
          <p
            className={`mt-2 font-montserrat text-[26px] font-medium text-black ${
              totalPayment == null ? "opacity-30" : ""
            }`}
          >
            {totalPayment == null ? "$-" : formatAmount(totalPayment, { padDecimals: true })}
          </p>
        </section>

        <section>
          <h2 className="font-montserrat text-base font-medium capitalize text-black">
            Recipients
          </h2>
          <p
            className={`mt-2 font-montserrat text-[26px] font-medium text-black ${
              recipients == null ? "opacity-30" : ""
            }`}
          >
            {recipients == null ? "-" : recipients}
          </p>
        </section>
      </Card>
      {walletDialogOpen ? <WalletConnectDialog onClose={() => setWalletDialogOpen(false)} /> : null}
      <TokenNetworkDialog
        open={tokenDialogOpen}
        onClose={() => setTokenDialogOpen(false)}
        title="Balance"
        initialSymbol="USDT"
        showBalances
        balanceOwners={owners}
        allowedBlockchains={PAYER_BLOCKCHAINS}
        onSelect={({ token }) => {
          setOriginToken(token);
          setTokenDialogOpen(false);
        }}
      />
    </>
  );
}
