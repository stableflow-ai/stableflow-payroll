import { IconLock } from "@/components/icons/lock";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import { formatAddress, formatAmount } from "@/utils";
import { formatTokenNetwork } from "../../batch-utils";
import type { IntentsToken } from "@/stores/intents-tokens";

export function BatchPreviewStep(props: {
  totalValued: string;
  breakdown: Array<{ key: string; label: string; amount: string }>;
  payoutCount: number;
  walletAddress: string | null;
  originToken: IntentsToken | null;
  feeLabel: string;
  costLabel: string;
  quoteError: string | null;
  quoting: boolean;
  canConfirm: boolean;
  sending: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const {
    totalValued,
    breakdown,
    payoutCount,
    walletAddress,
    originToken,
    feeLabel,
    costLabel,
    quoteError,
    quoting,
    canConfirm,
    sending,
    onBack,
    onConfirm,
  } = props;

  return (
    <Card className="mx-auto w-full max-w-[600px] px-5 py-6 sm:px-8 sm:py-8">
      <h2 className="font-montserrat text-xl font-semibold text-black">Preview & Confirm</h2>
      <p className="mt-2 font-montserrat text-sm text-[#606060]">Send a private payment from your organization's treasury.</p>

      <div className="mt-8 flex flex-col gap-4">
        <PreviewRow label="Total Valued" value={formatAmount(totalValued, { maxDecimals: 6 })} />

        <div>
          <p className="font-montserrat text-sm font-medium text-[#606060]">Token Breakdown</p>
          <div className="mt-2 flex flex-col gap-2">
            {breakdown.map((row) => (
              <div
                key={row.key}
                className="flex h-[34px] items-center justify-between rounded-[8px] bg-[#f6f6f6] px-3"
              >
                <span className="font-montserrat text-sm text-[#606060]">{row.label}</span>
                <span className="font-montserrat text-sm text-black">
                  {formatAmount(row.amount, { prefix: "", maxDecimals: 6 })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <PreviewRow label="Total Payouts" value={String(payoutCount)} />

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="font-montserrat text-sm font-medium text-[#606060]">Pay from</span>
            <span className="inline-flex h-[26px] items-center gap-1.5 rounded-[13px] border border-[#d0f348] bg-[rgba(208,243,72,0.2)] px-2.5 font-montserrat text-xs font-medium text-[#84a20f]">
              <IconLock className="size-3" />
              Private by default
            </span>
          </div>
          <span className="shrink-0 font-montserrat text-sm text-black">
            {walletAddress ? formatAddress(walletAddress) : "—"}
          </span>
        </div>

        <PreviewRow
          label="Paying Token"
          value={originToken ? formatTokenNetwork(originToken) : "—"}
        />
        <PreviewRow label="Total Fees" value={feeLabel} />
        <PreviewRow label="Total Cost" value={costLabel} />
      </div>

      {quoteError ? (
        <p className="mt-4 font-montserrat text-sm text-danger">{quoteError}</p>
      ) : null}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <Button variant="normal" size="lg" className="w-full sm:w-[205px]" onClick={onBack} disabled={sending}>
          Back
        </Button>
        <Button
          size="lg"
          className="w-full flex-1"
          loading={quoting || sending}
          disabled={Boolean(walletAddress) && !canConfirm && !quoting}
          onClick={onConfirm}
        >
          Confirm & Send
        </Button>
      </div>
    </Card>
  );
}

function PreviewRow(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-montserrat text-sm font-medium text-[#606060]">{props.label}</span>
      <span className="font-montserrat text-sm text-black">{props.value}</span>
    </div>
  );
}
