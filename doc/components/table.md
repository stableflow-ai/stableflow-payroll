# Table

Path: `src/components/ui/table/Table.tsx`

CSS Grid compound component. The header row and every body row share one `columns` template through context, so a scrollbar can never shift header cells out of line with body cells.

Scroll model: **one** `overflow-auto` container. Header and body sit in a `min-w-full` wrapper so `fr` tracks size against the card width (long cell text can `truncate` instead of stretching the table). `TableHeader` is `position: sticky; top: 0` with a `#FDFDFD` background, and `scrollbar-gutter: stable` is set on the scroller. Rows keep `min-w-min`; if column mins exceed the card, the scroller still pans horizontally and the header stays aligned. Cells use `min-w-0` so header and body resolve to the same track sizes.

The root is a [Card](card.md). Set a max height on `className` or `scrollClassName` to enable vertical scrolling.

## Parts

- `Table` — Card + scroll container. Requires `columns` (a CSS `grid-template-columns` value).
- `TableHeader` — sticky header row (grid)
- `TableBody` — body wrapper
- `TableRow` — body row (same grid), bottom divider except on the last row
- `TableHead` — header cell
- `TableCell` — body cell

`TableHeader`, `TableRow`, `TableHead`, and `TableCell` throw when rendered outside a `Table`.

## Props

**Table**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `columns` | `string` | required | e.g. `"minmax(150px,1.3fr) minmax(72px,0.5fr) minmax(140px,1fr)"` |
| `className` | `string` | — | The Card — set `max-h-[480px]` here for vertical scroll |
| `scrollClassName` | `string` | — | Inner overflow container |
| `toolbar` | `ReactNode` | — | Above the scroller (title, filters); does not scroll with the rows |
| `footer` | `ReactNode` | — | Below the scroller (pagination) |
| ...rest | div attributes | — | |

**TableHeader / TableBody / TableRow / TableHead / TableCell**

`HTMLAttributes<HTMLDivElement>`, including `className`.

Header cells: 14px Montserrat Medium, `#AAA`, capitalised. Body cells: 14px Montserrat Medium, black. Both use `px-2 py-3.5` with the first and last cell flush to the edge.

## Example

```tsx
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table/Table";
import { PAYOUT_TABLE_COLUMNS } from "@/views/pay/config";

<Table columns={PAYOUT_TABLE_COLUMNS}>
  <TableHeader>
    <TableHead>Recipient</TableHead>
    <TableHead>Amount</TableHead>
    <TableHead>Status</TableHead>
  </TableHeader>
  <TableBody>
    {rows.map((row) => (
      <TableRow key={row.id}>
        <TableCell>{row.recipient}</TableCell>
        <TableCell>{row.amount}</TableCell>
        <TableCell>{row.status}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## Notes

- Keep the column template in the feature's `config.ts` (`PAYOUT_TABLE_COLUMNS`, `RECEIVED_PAYMENT_TABLE_COLUMNS`), not inline, so the header and the row cannot drift apart.
- Do not add a second `overflow` on `TableBody`; that is what breaks header alignment.
- Header and body must stay inside the same `Table` so they share `columns`.
- Do not wrap rows in `w-max`. That makes `fr` tracks grow with content and blocks `truncate`.
- Overflowing cells need `min-w-0` (already on `TableCell`) plus `truncate` on the text node.
- The empty state is the caller's job — render a placeholder inside `TableBody` when there are no rows.
