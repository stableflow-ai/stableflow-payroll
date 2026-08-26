import type { ReactNode } from "react";
import { IconCheck } from "@/components/icons/check";
import { IconLock } from "@/components/icons/lock";
import { IconWallet } from "@/components/icons/wallet";
import { Button } from "@/components/ui/button/Button";
import { chainLogoUrl } from "@/lib/logo";
import type { IntentsToken } from "@/stores/intents-tokens";
import { DATE_FORMAT, formatAddress, formatDate } from "@/utils";
import { YouPaySection } from "@/views/pay/components/YouPaySection";
import { formatCouponAmount, truncateMiddle } from "@/views/pay/request-utils";
import Tooltip from "@/components/ui/tooltip/Tooltip";
import { FLOATING_SIDE } from "@/components/ui/overlay/use-floating-position";

export const REQUEST_PAY_CARD_STATE = {
  Loading: "loading",
  Pay: "pay",
  Paid: "paid",
  Deleted: "deleted",
} as const;

export type RequestPayCardState =
  (typeof REQUEST_PAY_CARD_STATE)[keyof typeof REQUEST_PAY_CARD_STATE];

function DestTokenMark({ token }: { token: IntentsToken }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative size-5 shrink-0">
        <img src={token.logo} alt="" className="size-5 rounded-full object-cover" />
        <img
          src={chainLogoUrl(token.blockchain)}
          alt=""
          className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-[2px] border border-white object-cover"
        />
      </span>
      <span className="font-montserrat text-sm font-medium text-black">{token.symbol}</span>
    </span>
  );
}

function CouponShell(props: { top: ReactNode; bottom: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[438px] rounded-[20px]">
      <div className="rounded-t-[20px] border border-b-0 border-white bg-[#fdfdfd] px-[30px] pt-8 pb-5 shadow-[0_0_20px_0_rgba(0,0,0,0.06)]">
        {props.top}
      </div>
      <img
        src="/pay/coupon-middle.png"
        alt=""
        aria-hidden
        draggable={false}
        className="block h-auto w-full"
      />
      <div className="rounded-b-[20px] border border-t-0 border-white bg-[#fdfdfd] px-[30px] pt-5 pb-8 shadow-[0_0_20px_0_rgba(0,0,0,0.06)]">
        {props.bottom}
      </div>
    </div>
  );
}

export function RequestPayCard(props: {
  state: RequestPayCardState;
  paymentName: string;
  createdAt: string;
  amount: string;
  destToken: IntentsToken | null;
  recipientAddress: string;
  description: string;
  youPayAmount: string;
  originToken: IntentsToken | null;
  onOriginTokenChange: (token: IntentsToken) => void;
  walletAddress: string | null;
  walletConnected: boolean;
  walletIcon?: string | null;
  connecting: boolean;
  onConnectWallet: () => void;
  quoteError: string | null;
  payLoading: boolean;
  canPay: boolean;
  onPay: () => void;
}) {
  const {
    state,
    createdAt,
    paymentName,
    amount,
    destToken,
    recipientAddress,
    description,
    youPayAmount,
    originToken,
    onOriginTokenChange,
    walletAddress,
    walletConnected,
    walletIcon,
    connecting,
    onConnectWallet,
    quoteError,
    payLoading,
    canPay,
    onPay,
  } = props;
  const couponAmount = formatCouponAmount(amount || "0");
  const memo = description.trim();
  const createdMonth = formatDate(createdAt, DATE_FORMAT.Month);

  if (state === REQUEST_PAY_CARD_STATE.Deleted || state === REQUEST_PAY_CARD_STATE.Loading) {
    return (
      <CouponShell
        top={
          <div className="flex min-h-[280px] flex-col items-center justify-center">
            {state === REQUEST_PAY_CARD_STATE.Loading ? (
              <p className="font-montserrat text-sm text-[#909090]">Loading…</p>
            ) : (
              <>
                <span className="inline-flex size-12 items-center justify-center rounded-full border border-dashed border-[#e3e3e3]">
                  <IconWallet className="text-[#d9d9d9]" />
                </span>
                <p className="mt-[25px] text-center font-montserrat text-base text-[#aaa]">
                  This payment request has been deleted
                </p>
              </>
            )}
          </div>
        }
        bottom={<div className="min-h-[180px]" />}
      />
    );
  }

  return (
    <CouponShell
      top={
        <>
          {paymentName ? (
            <Tooltip
              side={FLOATING_SIDE.Top}
              content={`Invoice-${paymentName}-${createdMonth}`}
              triggerClassName="flex justify-center items-center"
            >
              <h1 className="text-center font-montserrat text-lg font-semibold text-black cursor-pointer">
                <span>Invoice-</span>
                <span>{truncateMiddle(paymentName)}</span>
                <span>-{createdMonth}</span>
              </h1>
            </Tooltip>
          ) : null}
          <p className="mt-4 text-center font-montserrat text-[32px] leading-none font-semibold text-black">
            {couponAmount.whole}
            {
              !!couponAmount.fraction && (
                <span className="text-[#aaa]">.{couponAmount.fraction}</span>
              )
            }
          </p>
          {destToken ? (
            <div className="mt-3 flex justify-center">
              <DestTokenMark token={destToken} />
            </div>
          ) : null}

          {/*
            Phase 2 QR: after Pay Now, swap/status returns depositAddress.
            Encode EIP-681:
            ethereum:{token}@chainId/transfer?address={depositAddress}&uint256={amountInAtomic}.
            A backend job polls until paid, then this page shows the paid state.
          */}

          <div className="mt-8 flex items-start justify-between gap-3">
            <p className="font-montserrat text-sm font-medium capitalize text-[#aaa]">
              Make a payment to
            </p>
            <p className="min-w-0 text-right font-montserrat text-sm text-black">
              {formatAddress(recipientAddress)}
            </p>
          </div>
          {memo ? (
            <div className="mt-4 flex items-start justify-between gap-3">
              <p className="shrink-0 font-montserrat text-sm font-medium capitalize text-[#aaa]">
                Description
              </p>
              <p className="min-w-0 text-right font-montserrat text-sm text-black">{memo}</p>
            </div>
          ) : null}
        </>
      }
      bottom={
        state === REQUEST_PAY_CARD_STATE.Paid ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center">
            <span
              className="inline-flex size-[26px] items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(14, 208, 0, 0.2)" }}
            >
              <IconCheck className="text-[#0ED000]" />
            </span>
            <p className="mt-3 text-center font-montserrat text-sm font-medium text-[#0ED000]">
              This payment has been paid
            </p>
          </div>
        ) : (
          <>
            <YouPaySection
              amountDisplay={youPayAmount}
              originToken={originToken}
              onOriginTokenChange={onOriginTokenChange}
              walletAddress={walletAddress}
              walletConnected={walletConnected}
              walletIcon={walletIcon}
              connecting={connecting}
              onConnectWallet={onConnectWallet}
            />
            <div className="mt-4 h-px w-full bg-[#e3e3e3]" />
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="font-montserrat text-xs text-[#70788a]">
                Est. Cost {youPayAmount}
              </span>
              <span className="inline-flex h-[26px] items-center gap-1.5 rounded-[13px] border border-[#d0f348] bg-[rgba(208,243,72,0.2)] px-2.5 font-montserrat text-xs font-medium text-[#84a20f]">
                <IconLock className="size-3" />
                Private by default
              </span>
            </div>
            {quoteError ? (
              <p className="mt-2 font-montserrat text-xs text-danger">{quoteError}</p>
            ) : null}
            <Button
              size="xl"
              className="mt-6 w-full"
              loading={payLoading}
              disabled={!canPay && Boolean(walletAddress)}
              onClick={onPay}
            >
              Pay Now
            </Button>
          </>
        )
      }
    />
  );
}
