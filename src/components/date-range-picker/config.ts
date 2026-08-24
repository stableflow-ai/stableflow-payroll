export const DATE_RANGE_WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export const DATE_RANGE_PRESET = {
  Days30: 30,
  Days7: 7,
  Days1: 1,
} as const;

export const DATE_RANGE_PRESET_OPTIONS = [
  { days: DATE_RANGE_PRESET.Days30, label: "Last 30 days" },
  { days: DATE_RANGE_PRESET.Days7, label: "Last 7 days" },
  { days: DATE_RANGE_PRESET.Days1, label: "Last 1 day" },
] as const;
