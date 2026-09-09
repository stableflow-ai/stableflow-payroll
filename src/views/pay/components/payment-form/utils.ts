import {
  PAYABLE_TYPE,
  effectiveNetPay,
  payableAdjustments,
  payableNotification,
  type Payable,
  type PayablePayRequest,
} from "@/types/payable";
import { isBatchOriginToken } from "../../batch-utils";
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

export function buildPayablePayRequest(input: {
  payable: Payable | null;
  originToken: IntentsToken | null;
  payer: string | null;
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
    organizationId,
    timezone,
    notifyEnabled,
    selectedItemIds,
    netPayById = {},
  } = input;
  if (!payable || !originToken || !payer || organizationId == null) return null;
  if (!isBatchOriginToken(originToken)) return null;
  const notification = notifyEnabled
    ? payableNotification(selectedItemIds, payableItemIds(payable))
    : undefined;
  const adjustments = payableAdjustments(payable.items, netPayById);
  const base = {
    organization_id: organizationId,
    payer,
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
  return {
    type: payable.type,
    batchId: payable.batchId,
    ...base,
  };
}
