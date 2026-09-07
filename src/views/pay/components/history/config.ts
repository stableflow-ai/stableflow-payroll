export const HISTORY_FILTER_ALL = "all";

export const HISTORY_PAGE_SIZE = 10;

export const HISTORY_STATUS_FILTER = {
  All: HISTORY_FILTER_ALL,
  Success: "success",
  Failed: "failed",
} as const;

export const HISTORY_STATUS_OPTIONS = [
  { value: HISTORY_STATUS_FILTER.All, label: "All" },
  { value: HISTORY_STATUS_FILTER.Success, label: "Success" },
  { value: HISTORY_STATUS_FILTER.Failed, label: "Failed" },
] as const;

export const HISTORY_AMOUNT_FILTER = {
  All: HISTORY_FILTER_ALL,
  Under1k: "0-1000",
  From1kTo10k: "1000-10000",
  Over10k: "over-10000",
} as const;

export const HISTORY_AMOUNT_OPTIONS = [
  { value: HISTORY_AMOUNT_FILTER.All, label: "All" },
  { value: HISTORY_AMOUNT_FILTER.Under1k, label: "0-1,000" },
  { value: HISTORY_AMOUNT_FILTER.From1kTo10k, label: "1,000-10,000" },
  { value: HISTORY_AMOUNT_FILTER.Over10k, label: ">10,000" },
] as const;

export const HISTORY_TABLE_COLUMNS =
  "minmax(72px,0.6fr) minmax(140px,1.1fr) 28px minmax(88px,0.7fr) minmax(150px,1.2fr) minmax(130px,1fr) minmax(130px,1fr) minmax(140px,1fr)";
