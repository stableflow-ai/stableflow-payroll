# DateRangePicker

Shared calendar range picker used by Transaction History and Partner Reports.

Path: `src/components/date-range-picker/DateRangePicker.tsx`

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `value` | `{ from: Date; to: Date }` | `from` is start of day; `to` is end of day |
| `onChange` | `(range) => void` | Fired on preset click or second calendar click. The second click may be the **same day** as the first (`from` start of day, `to` end of day). |
| `className` | `string?` | Wrapper |
| `triggerClassName` | `string?` | Trigger button |

Presets: Last 30 days, Last 7 days, Last 1 day (`src/components/date-range-picker/config.ts`).

Helpers in `utils.ts`: `lastNDaysRange`, `calendarRangeFromPicks`, `formatDateRangeLabel` (same calendar day shows one date), `isInDateRange`, `rangeToUnixSeconds` (unix seconds for `start_time` / `end_time`).
