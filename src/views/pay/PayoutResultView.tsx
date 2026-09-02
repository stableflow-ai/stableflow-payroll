/**
 * Landing page for `success_url`. The hosted checkout only returns here after a
 * successful payment, so there is nothing to poll: read the payment once and
 * fall back to the query the checkout appended.
 */
import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { IconCheck2 } from "@/components/icons/check";
import { IconLoading } from "@/components/icons/loading";
import { IconOutLink } from "@/components/icons/link";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import { chainDisplayName, txExplorerUrl } from "@/config/chains";
import { usePayrollPaymentQuery } from "@/hooks/use-single-payout-api";
import { DATE_FORMAT, formatAddress, formatDate } from "@/utils";
import { PAYOUT_RESULT_STATUS } from "./config";
import { parsePayoutCallbackParams } from "./utils";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <span className="shrink-0 font-montserrat text-sm font-medium text-[#909090]">{label}</span>
      <span className="min-w-0 text-right font-montserrat text-sm font-medium break-all text-black">
        {children}
      </span>
    </div>
  );
}

function ExplorerLink({ href, text }: { href: string | null; text: string }) {
  if (!href) return <>{text}</>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 hover:opacity-70"
    >
      {text}
      <IconOutLink className="shrink-0" />
    </a>
  );
}

export function PayoutResultView() {
  const [params] = useSearchParams();
  const callback = parsePayoutCallbackParams(params);
  const query = usePayrollPaymentQuery(callback.paymentId);
  const payment = query.data;

  const status = payment?.status || callback.status || PAYOUT_RESULT_STATUS.Success;
  const succeeded = status === PAYOUT_RESULT_STATUS.Success
    || status === PAYOUT_RESULT_STATUS.Completed;
  const amount = payment?.destinationAmount || callback.amount;
  const symbol = payment?.destinationSymbol || callback.symbol;
  const network = payment?.destinationNetwork || callback.network;
  const recipient = payment?.recipient || callback.recipient;
  const destinationTxHash = payment?.destinationTxHash || callback.destinationTxHash;
  const txHash = payment?.txHash || callback.txHash;
  const paidAt = payment?.paidAt || callback.paidAt;

  return (
    <Card className="mx-auto w-full max-w-[560px] px-6 py-8 sm:px-8">
      <div className="flex flex-col items-center text-center">
        {succeeded ? (
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-[#769400]/10">
            <IconCheck2 className="size-5 text-[#769400]" />
          </span>
        ) : (
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-[#6284F5]/10">
            <IconLoading className="size-5 animate-spin text-[#6284F5]" />
          </span>
        )}
        <h2 className="mt-4 font-montserrat text-xl font-semibold text-black">
          {succeeded ? "Payment sent" : "Payment in progress"}
        </h2>
        {amount ? (
          <p className="mt-1.5 font-montserrat text-[26px] font-medium text-black">
            {amount} {symbol}
          </p>
        ) : null}
      </div>

      <div className="mt-7 divide-y divide-[#e3e3e3] border-t border-[#e3e3e3]">
        {recipient ? (
          <Row label="Recipient">
            <ExplorerLink
              href={txExplorerUrl(network, destinationTxHash)}
              text={formatAddress(recipient)}
            />
          </Row>
        ) : null}
        {network ? <Row label="Network">{chainDisplayName(network) || network}</Row> : null}
        {payment?.sourceAmount ? (
          <Row label="You paid">
            {payment.sourceAmount} {payment.sourceSymbol}
          </Row>
        ) : null}
        {payment?.memo ? <Row label="Memo">{payment.memo}</Row> : null}
        {txHash ? (
          <Row label="Transaction">
            <ExplorerLink
              href={txExplorerUrl(payment?.sourceNetwork || network, txHash)}
              text={formatAddress(txHash)}
            />
          </Row>
        ) : null}
        {paidAt ? <Row label="Paid at">{formatDate(paidAt, DATE_FORMAT.DateTime)}</Row> : null}
        {callback.paymentId ? <Row label="Payment ID">{callback.paymentId}</Row> : null}
      </div>

      {query.isError ? (
        <p className="mt-4 font-montserrat text-xs text-[#909090]">
          Could not load the full payment details. The summary above comes from the checkout.
        </p>
      ) : null}

      <Link to="/pay" className="mt-8 block">
        <Button size="lg" className="w-full">
          Back to Single Payout
        </Button>
      </Link>
    </Card>
  );
}
