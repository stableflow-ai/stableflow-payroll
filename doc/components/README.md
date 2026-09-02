# Public UI Components

Non-business primitives in `src/components/ui/`, plus shared widgets that several features depend on. Read the matching doc before using or editing a component.

| Component | Path | Doc |
| --- | --- | --- |
| Button | `src/components/ui/button/Button.tsx` | [button.md](button.md) |
| Card | `src/components/ui/card/Card.tsx` | [card.md](card.md) |
| Dialog | `src/components/ui/dialog/Dialog.tsx` | [dialog.md](dialog.md) |
| Drawer | `src/components/ui/drawer/Drawer.tsx` | [drawer.md](drawer.md) |
| Dropdown | `src/components/ui/dropdown/Dropdown.tsx` | [dropdown.md](dropdown.md) |
| InputNumber | `src/components/ui/input-number/InputNumber.tsx` | [input-number.md](input-number.md) |
| Pagination | `src/components/ui/pagination/Pagination.tsx` | [pagination.md](pagination.md) |
| SearchInput | `src/components/ui/search-input/SearchInput.tsx` | [search-input.md](search-input.md) |
| Switch | `src/components/ui/switch/Switch.tsx` | [switch.md](switch.md) |
| Table | `src/components/ui/table/Table.tsx` | [table.md](table.md) |
| Toast | `src/components/ui/toast/Toast.tsx` | [toast.md](toast.md) |
| Tooltip | `src/components/ui/tooltip/Tooltip.tsx` | [tooltip.md](tooltip.md) |
| DateRangePicker | `src/components/date-range-picker/DateRangePicker.tsx` | [date-range-picker.md](date-range-picker.md) |

`src/components/ui/overlay/` is **internal**. `Overlay`, `OverlayPanel`, the z-index stack, and `useFloatingPosition` back Dialog, Drawer, Dropdown, Tooltip, and DateRangePicker. Do not import them from a view or a feature component; extend one of the documented components instead.

Business widgets are not listed here. `TokenSelectDialog`, `WalletConnect`, `RecipientAvatar`, and the Pay-local components under `src/views/pay/components/` carry product logic and live next to their feature.

When you change a public component, update its doc and [CHANGELOG.md](CHANGELOG.md).
