import {
  PAYABLE_TYPE,
  effectiveNetPay,
  payableNotification,
  payablePayrollAdjustments,
  type Payable,
  type PayablePayRequest,
} from "@/types/payable";
import { isBatchOriginToken } from "../../batch-utils";
import type { PayablePayQuote, PayrollBatchPayment } from "@/types/payout";
import type { IntentsToken } from "@/stores/intents-tokens";
import { Big } from "@/utils";

export function payableItemIds(payable: Payable): number[] {
  return payable.items.map((item) => item.id);
}

export function sumPayableNetPay(
  payable: Payable,
  overrides: Record<number, string>,
): string {
  return payable.items
    .reduce((sum, item) => {
      try {
        return sum.plus(effectiveNetPay(item, overrides) || 0);
      } catch {
        return sum;
      }
    }, new Big(0))
    .toFixed();
}

export function sumPayableVolume(payable: Payable): string {
  const volumes = payable.items.map((item) => item.volume.trim());
  if (volumes.every((value) => !value)) {
    return payable.totalPayout.trim() || "0";
  }
  return volumes
    .reduce((sum, value) => {
      if (!value) return sum;
      try {
        return sum.plus(value);
      } catch {
        return sum;
      }
    }, new Big(0))
    .toFixed();
}

export function sumQuoteDestinationVolume(
  payments: readonly Pick<PayrollBatchPayment, "destinationVolume">[],
): string {
  return payments
    .reduce((sum, payment) => {
      const value = payment.destinationVolume.trim();
      if (!value) return sum;
      try {
        return sum.plus(value);
      } catch {
        return sum;
      }
    }, new Big(0))
    .toFixed();
}

export function payableQuotePayments(quote: PayablePayQuote): PayrollBatchPayment[] {
  return quote.batches.flatMap((row) => row.batch.payments);
}

export function payableQuoteSourceAmount(quote: PayablePayQuote): string {
  return quote.batches
    .reduce((sum, row) => {
      const value = row.batch.totalSourceAmount.trim();
      if (!value) return sum;
      try {
        return sum.plus(value);
      } catch {
        return sum;
      }
    }, new Big(0))
    .toFixed();
}

export function buildPayablePayRequest(input: {
  payable: Payable | null;
  originToken: IntentsToken | null;
  payer: string | null;
  refundTo: string | null;
  organizationId: number | null;
  timezone: string;
  notifyEnabled: boolean;
  selectedItemIds: readonly number[];
  netPayById?: Record<number, string>;
}): PayablePayRequest | null {
  const {
    payable,
    originToken,
    payer,
    refundTo,
    organizationId,
    timezone,
    notifyEnabled,
    selectedItemIds,
    netPayById = {},
  } = input;
  if (!payable || !originToken || !payer || !refundTo || organizationId == null) return null;
  if (!isBatchOriginToken(originToken)) return null;
  const notification = notifyEnabled
    ? payableNotification(selectedItemIds, payableItemIds(payable))
    : undefined;
  const adjustments =
    payable.type === PAYABLE_TYPE.Payroll
      ? payablePayrollAdjustments(payable.items, netPayById)
      : undefined;
  const base = {
    organization_id: organizationId,
    payer,
    refundTo,
    source_network: originToken.blockchain,
    source_symbol: originToken.symbol,
    ...(notification ? { notification } : {}),
    ...(adjustments ? { adjustments } : {}),
  };
  if (payable.type === PAYABLE_TYPE.Payroll) {
    if (!payable.periodMonth) return null;
    return {
      type: PAYABLE_TYPE.Payroll,
      period_month: payable.periodMonth,
      timezone,
      ...base,
    };
  }
  if (!payable.batchId) return null;
  return {
    type: payable.type,
    batchId: payable.batchId,
    ...base,
  };
}
