# Table

Path: `src/components/ui/table/Table.tsx`

Figma: DapDap V2 `41560:283`.

CSS Grid compound component. Header and body rows share one `columns` template, so a scrollbar cannot shift header cells relative to body cells.

Scroll model: **one** `overflow-auto` container. Header and body sit in a `w-max min-w-full` wrapper so a horizontal scrollbar also covers the header. `TableHeader` is `position: sticky; top: 0`. `scrollbar-gutter: stable` is set on the scroller as a fallback. Cells use `min-w-0` so header and body share the same `columns` track sizes.

The root is a [Card](card.md). Set a max height on `className` or `scrollClassName` to enable vertical scrolling.

## Parts

- `Table` — Card + scroll container. Requires `columns` (CSS `grid-template-columns`).
- `TableHeader` — sticky header row (grid)
- `TableBody` — body wrapper
- `TableRow` — body row (same grid)
- `TableHead` — header cell
- `TableCell` — body cell

## Props

**Table**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `columns` | `string` | required | e.g. `"minmax(160px,1.4fr) minmax(80px,0.7fr) minmax(140px,1fr)"` |
| `className` | `string` | — | Card (set `max-h-[480px]` here for vertical scroll) |
| `scrollClassName` | `string` | — | Inner overflow container |
| `toolbar` | `ReactNode` | — | Above the scroller (title, filters). Does not scroll horizontally with rows. |
| `footer` | `ReactNode` | — | Below the scroller (pagination). |
| ...rest | div attributes | — | |

**TableHeader / TableBody / TableRow / TableHead / TableCell**

Standard `HTMLAttributes<HTMLDivElement>` including `className`.

Header text defaults: 14px Montserrat Medium, `#AAA`, capitalize.  
Body text defaults: 14px Montserrat Medium, `#000`.  
Rows: bottom divider.

## Example

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/Table";

<Table
  className="max-h-[420px] w-full"
  columns="minmax(160px,1.4fr) minmax(80px,0.6fr) minmax(140px,1fr) minmax(120px,1fr) minmax(140px,0.9fr) minmax(100px,0.7fr)"
>
  <TableHeader>
    <TableHead>Recipient</TableHead>
    <TableHead>Amount</TableHead>
    <TableHead>Asset</TableHead>
    <TableHead>Memo</TableHead>
    <TableHead>Time</TableHead>
    <TableHead>Status</TableHead>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>0x541...38Dc1</TableCell>
      <TableCell>5,000</TableCell>
      <TableCell>USDC · Arbitrum</TableCell>
      <TableCell>include expense</TableCell>
      <TableCell>Aug 1, 2026 11:56</TableCell>
      <TableCell className="text-[#769400]">Complete</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Notes

- Do not put a second overflow on `TableBody`. That would reintroduce header/body drift.
- Header and body must stay inside the same `Table` so they share `columns`.
