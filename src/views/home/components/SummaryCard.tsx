import { useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import { WalletConnectDialog } from "@/components/WalletConnect";
import { tokenLogoUrl } from "@/lib/logo";
import { formatAmount } from "@/utils";
import type { HomeDashboard } from "@/mocks/home";

export function SummaryCard({
  dashboard,
  hasWallet,
}: {
  dashboard: HomeDashboard;
  hasWallet: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Card className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <section>
          <h2 className="font-montserrat text-base font-medium capitalize text-black">Balance</h2>
          {hasWallet ? (
            <>
              <p className="mt-2 font-montserrat text-[26px] font-medium text-black">
                {formatAmount(dashboard.balanceUsd, { padDecimals: true })}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {dashboard.tokens.map((token) => (
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
            </>
          ) : (
            <Button
              variant="primary"
              size="md"
              className="mt-4 px-[22px]"
              onClick={() => setDialogOpen(true)}
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
              dashboard.totalPaymentUsd == null ? "opacity-30" : ""
            }`}
          >
            {dashboard.totalPaymentUsd == null
              ? "$-"
              : formatAmount(dashboard.totalPaymentUsd, { padDecimals: true })}
          </p>
        </section>

        <section>
          <h2 className="font-montserrat text-base font-medium capitalize text-black">
            Recipients
          </h2>
          <p
            className={`mt-2 font-montserrat text-[26px] font-medium text-black ${
              dashboard.recipients == null ? "opacity-30" : ""
            }`}
          >
            {dashboard.recipients == null ? "-" : dashboard.recipients}
          </p>
        </section>
      </Card>
      {dialogOpen ? <WalletConnectDialog onClose={() => setDialogOpen(false)} /> : null}
    </>
  );
}
