import { HISTORY_STATUS, HISTORY_TYPE } from "@/types/history";

export const HISTORY_FILTER_ALL = "all";

export const HISTORY_PAGE_SIZE = 10;

export const HISTORY_SEARCH_DEBOUNCE_MS = 300;

export const HISTORY_STATUS_FILTER = {
  All: HISTORY_FILTER_ALL,
  ...HISTORY_STATUS,
} as const;

export const HISTORY_STATUS_OPTIONS = [
  { value: HISTORY_STATUS_FILTER.All, label: "All" },
  { value: HISTORY_STATUS_FILTER.Created, label: "Created" },
  { value: HISTORY_STATUS_FILTER.Processing, label: "Processing" },
  { value: HISTORY_STATUS_FILTER.Completed, label: "Completed" },
  { value: HISTORY_STATUS_FILTER.Failed, label: "Failed" },
  { value: HISTORY_STATUS_FILTER.Expired, label: "Expired" },
] as const;

export const HISTORY_STATUS_SUCCESS_CLASS = "text-[#84A20F]";
export const HISTORY_STATUS_FAILED_CLASS = "text-[#FF5656]";
export const HISTORY_STATUS_OTHER_CLASS = "text-black";

export const HISTORY_TYPE_FILTER = {
  All: HISTORY_FILTER_ALL,
  ...HISTORY_TYPE,
} as const;

export const HISTORY_TYPE_OPTIONS = [
  { value: HISTORY_TYPE_FILTER.All, label: "All" },
  { value: HISTORY_TYPE_FILTER.Income, label: "Income" },
  { value: HISTORY_TYPE_FILTER.Payout, label: "Payout" },
] as const;

export const HISTORY_AMOUNT_INCOME_CLASS = HISTORY_STATUS_SUCCESS_CLASS;
export const HISTORY_AMOUNT_PAYOUT_CLASS = HISTORY_STATUS_FAILED_CLASS;

export const HISTORY_TABLE_COLUMNS =
  "minmax(72px,0.6fr) minmax(140px,1.1fr) 28px minmax(88px,0.7fr) minmax(150px,1.2fr) minmax(130px,1fr) minmax(130px,1fr) minmax(140px,1fr) minmax(110px,0.8fr)";

export const HISTORY_TABLE_COLUMNS_MEMBER = `minmax(88px,0.7fr) ${HISTORY_TABLE_COLUMNS}`;
