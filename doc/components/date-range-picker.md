# DateRangePicker

Path: `src/components/date-range-picker/DateRangePicker.tsx`
Helpers: `src/components/date-range-picker/utils.ts`
Constants: `src/components/date-range-picker/config.ts`

Shared widget, not a `ui/` primitive: it owns the product's range presets and label format. Trigger plus a portalled month calendar with preset shortcuts. Always controlled.

## Trigger

Matches [Dropdown](dropdown.md): height 36px, radius 6px, border `#E3E3E3`, white, Montserrat Medium 14px, `IconArrowDown` rotating while open. A static `Time` label sits on the left and the formatted range right-aligns.

## Panel

Portalled to `document.body` at `z-index: 1100`, anchored below the trigger with a 6px offset, `width: min(320px, 100vw - 32px)`, radius 16px, shadow `0 8px 24px rgba(0,0,0,0.08)`.

Month header with previous / next arrows, a Su–Sa week grid, then the preset list. Picking a day sets the draft start; picking a second day commits the range and closes. The selected endpoints are black-on-white, days inside a committed range get a `rgba(0,0,0,0.05)` background, and days outside the visible month are `#ccc`. Outside pointer-down and Escape close the panel and discard a half-finished pick.

Presets: Last 30 days, Last 7 days, Last 1 day (`DATE_RANGE_PRESET` / `DATE_RANGE_PRESET_OPTIONS`).

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `DateRangeValue` | required | `{ from: Date; to: Date }` |
| `onChange` | `(range: DateRangeValue) => void` | required | Fired on commit, never mid-selection |
| `className` | `string` | — | Wrapper (`relative inline-block`) |
| `triggerClassName` | `string` | — | Trigger button |

## Helpers

| Function | Notes |
| --- | --- |
| `lastNDaysRange(days, now?)` | Inclusive range ending today; `from` is start of day, `to` is end of day |
| `calendarRangeFromPicks(start, end)` | Orders two picks and snaps them to day boundaries |
| `matchesLastNDays(range, days, now?)` | Whether a range equals a preset |
| `formatDateRangeLabel(range, now?)` | Preset name when it matches one, otherwise `MMM d, yyyy – MMM d, yyyy` |
| `rangeToUnixSeconds(range)` | `{ start_time, end_time }` in seconds — the shape the API expects |
| `isInDateRange(iso, range)` | Client-side filter; invalid dates pass |
| `dateRangeDayCount(range)` | Inclusive day count |

## Example

```tsx
import { DateRangePicker } from "@/components/date-range-picker/DateRangePicker";
import { DATE_RANGE_PRESET } from "@/components/date-range-picker/config";
import { lastNDaysRange, rangeToUnixSeconds } from "@/components/date-range-picker/utils";

const [range, setRange] = useState(() => lastNDaysRange(DATE_RANGE_PRESET.Days30));
const times = rangeToUnixSeconds(range);

<DateRangePicker
  value={range}
  onChange={(next) => { setRange(next); setPage(1); }}
  className="flex-1 md:w-[200px]"
/>
```

## Notes

- Always send `rangeToUnixSeconds(range)` to the API rather than formatting the dates yourself; the backend expects Unix seconds.
- Initialise state with a lazy `useState(() => lastNDaysRange(...))` so a new `Date` is not created on every render.
- Ranges are local time and inclusive of both endpoints.
