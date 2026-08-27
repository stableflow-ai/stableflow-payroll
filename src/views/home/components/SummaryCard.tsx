import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { IconArrowDown } from "@/components/icons/arrow-down";
import { WalletConnectDialog } from "@/components/WalletConnect";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import { PAYER_BLOCKCHAINS } from "@/config/chains";
import { useEnsureTokenBalances } from "@/hooks/use-token-balances";
import { useConnectedWallets } from "@/hooks/use-wallet";
import { tokenLogoUrl } from "@/lib/logo";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/utils";
import { PAYOUT_SYMBOLS, useIntentsTokensStore } from "@/stores/intents-tokens";
import { useTokenBalancesStore } from "@/stores/token-balances";
import { HOME_BALANCE_CHIP_ROW_HEIGHT_PX, HOME_BALANCE_POLL_MS } from "../config";

function ownerForKind(owners: ReturnType<typeof useConnectedWallets>, kind: string) {
  if (kind === "evm" || kind === "near" || kind === "solana" || kind === "tron") return owners[kind];
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
  const [chipsExpanded, setChipsExpanded] = useState(false);
  const [chipsOverflow, setChipsOverflow] = useState(false);
  const chipsRef = useRef<HTMLDivElement>(null);
  const owners = useConnectedWallets();
  const hasWallet = Boolean(owners.evm || owners.near || owners.solana || owners.tron);
  const ensureFresh = useIntentsTokensStore((s) => s.ensureFresh);
  const tokens = useIntentsTokensStore((s) => s.tokens);
  const getBalance = useTokenBalancesStore((s) => s.getBalance);
  const balanceEntries = useTokenBalancesStore((s) => s.balances);

  useEffect(() => {
    void ensureFresh();
  }, [ensureFresh]);

  const payerTokens = useMemo(
    () => tokens.filter((token) => PAYER_BLOCKCHAINS.includes(token.blockchain)),
    [tokens],
  );

  useEnsureTokenBalances({
    owners,
    tokens: payerTokens,
    enabled: hasWallet && payerTokens.length > 0,
    pollMs: HOME_BALANCE_POLL_MS,
  });

  const totals = useMemo(() => {
    const bySymbol = new Map<string, number>(PAYOUT_SYMBOLS.map((symbol) => [symbol, 0]));
    let usd = 0;
    for (const token of payerTokens) {
      const owner = ownerForKind(owners, token.chain.chainKind);
      const formatted = getBalance(owner, token.assetId)?.formatted;
      const amount = Number(formatted);
      if (!Number.isFinite(amount)) continue;
      bySymbol.set(token.symbol, (bySymbol.get(token.symbol) || 0) + amount);
      const price = Number(token.price);
      usd += amount * (Number.isFinite(price) ? price : 0);
    }
    return {
      usd,
      chips: PAYOUT_SYMBOLS
        .map((symbol) => ({ symbol, amount: bySymbol.get(symbol) || 0 }))
        .filter((token) => token.amount > 0),
    };
  }, [payerTokens, owners, getBalance, balanceEntries]);

  useLayoutEffect(() => {
    const el = chipsRef.current;
    if (!el) {
      setChipsOverflow(false);
      return;
    }
    function measure() {
      if (!el) return;
      setChipsOverflow(el.scrollHeight > HOME_BALANCE_CHIP_ROW_HEIGHT_PX + 1);
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [totals.chips]);

  return (
    <>
      <Card className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <section>
          <h2 className="font-montserrat text-base font-medium capitalize text-black">Balance</h2>
          {hasWallet ? (
            <div className="mt-2 block w-full text-left">
              <p className="font-montserrat text-[26px] font-medium text-black">
                {formatAmount(totals.usd, { padDecimals: true })}
              </p>
              {totals.chips.length > 0 ? (
                <div className="mt-3 flex items-start gap-1.5">
                  <div
                    ref={chipsRef}
                    className={cn(
                      "flex min-w-0 flex-1 flex-wrap gap-1.5 overflow-hidden",
                      !chipsExpanded && "h-[30px]",
                    )}
                  >
                    {totals.chips.map((token) => (
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
                          {formatAmount(token.amount, { prefix: "", padDecimals: true, showDust: true })}
                        </span>
                      </span>
                    ))}
                  </div>
                  {chipsOverflow ? (
                    <button
                      type="button"
                      aria-label={chipsExpanded ? "Collapse tokens" : "Expand tokens"}
                      onClick={() => setChipsExpanded((open) => !open)}
                      className="py-2 px-1 translate-y-1 shrink-0 cursor-pointer text-black"
                    >
                      <IconArrowDown className={cn("transition-transform", chipsExpanded && "rotate-180")} />
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
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
            className={`mt-2 font-montserrat text-[26px] font-medium text-black ${(totalPayment == null || totalPayment == "0") ? "opacity-30" : ""
              }`}
          >
            {(totalPayment == null || totalPayment == "0") ? "$-" : formatAmount(totalPayment, { padDecimals: true })}
          </p>
        </section>

        <section>
          <h2 className="font-montserrat text-base font-medium capitalize text-black">
            Recipients
          </h2>
          <p
            className={`mt-2 font-montserrat text-[26px] font-medium text-black ${(recipients == null || recipients == 0) ? "opacity-30" : ""
              }`}
          >
            {(recipients == null || recipients == 0) ? "-" : recipients}
          </p>
        </section>
      </Card>
      {walletDialogOpen ? <WalletConnectDialog onClose={() => setWalletDialogOpen(false)} /> : null}
    </>
  );
}
