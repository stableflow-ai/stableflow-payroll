import Big from "big.js";

export { Big };
export const ROUND_DOWN = Big.roundDown;
export const ROUND_UP = Big.roundUp;
export const ROUND_HALF_UP = Big.roundHalfUp;
export const ROUND_HALF_EVEN = Big.roundHalfEven;

export type AmountRoundingMode = 0 | 1 | 2 | 3;

export type FormatAmountOptions = {
  decimals?: number;
  maxDecimals?: number;
  rounding?: AmountRoundingMode;
  padDecimals?: boolean;
  showDust?: boolean;
  prefix?: string;
};

export function formatAmount(
  value: string | number | Big,
  options: FormatAmountOptions = {},
): string {
  const {
    decimals,
    maxDecimals = 2,
    rounding = ROUND_DOWN,
    padDecimals = false,
    showDust = false,
    prefix = "$",
  } = options;

  const amount = parseAmount(value, decimals);
  const abs = amount.abs();
  const minUnit = new Big(10).pow(-maxDecimals);

  if (showDust && abs.gt(0) && abs.lt(minUnit)) {
    return `${prefix} <${minUnit.toFixed(maxDecimals)}`;
  }

  const negative = amount.lt(0);
  const fixed = abs.toFixed(maxDecimals, rounding);
  const [intPart, fracPart = ""] = fixed.split(".");
  const fraction = padDecimals ? fracPart : fracPart.replace(/0+$/, "");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const body = fraction.length > 0 ? `${grouped}.${fraction}` : grouped;
  return `${prefix}${negative ? "-" : ""}${body}`;
}

function parseAmount(value: string | number | Big, decimals?: number): Big {
  try {
    let amount = value instanceof Big ? value : new Big(value);
    if (decimals != null) {
      amount = amount.div(new Big(10).pow(decimals));
    }
    return amount;
  } catch {
    return new Big(0);
  }
}
