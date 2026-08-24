# Public UI Components

Non-business primitives in `src/components/ui/`. Read the matching doc before using or editing a component.

| Component | Path | Doc |
| --- | --- | --- |
| Card | `src/components/ui/card/Card.tsx` | [card.md](card.md) |
| Dialog | `src/components/ui/dialog/Dialog.tsx` | [dialog.md](dialog.md) |
| Drawer | `src/components/ui/drawer/Drawer.tsx` | [drawer.md](drawer.md) |
| Button | `src/components/ui/button/Button.tsx` | [button.md](button.md) |
| Tooltip | `src/components/ui/tooltip/Tooltip.tsx` | [tooltip.md](tooltip.md) |
| SearchInput | `src/components/ui/search-input/SearchInput.tsx` | [search-input.md](search-input.md) |
| Table | `src/components/ui/table/Table.tsx` | [table.md](table.md) |
| Dropdown | `src/components/ui/dropdown/Dropdown.tsx` | [dropdown.md](dropdown.md) |
| Toast | `src/components/ui/toast/Toast.tsx` | (existing; no dedicated doc yet) |
| Pagination | `src/components/ui/pagination/Pagination.tsx` | [pagination.md](pagination.md) |
| InputNumber | `src/components/ui/input-number/InputNumber.tsx` | (existing; no dedicated doc yet) |
| Switch | `src/components/ui/switch/Switch.tsx` | [switch.md](switch.md) |
| DateRangePicker | `src/components/date-range-picker/DateRangePicker.tsx` | [date-range-picker.md](date-range-picker.md) |

`src/components/ui/overlay/` is **internal**. Dialog and Drawer own the public overlay API. Do not import Overlay from feature code unless you are extending those primitives.

When you change a public component, update its doc and [CHANGELOG.md](CHANGELOG.md).
