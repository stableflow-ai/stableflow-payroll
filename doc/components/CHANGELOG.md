# Component Changelog

Newest first. Add an entry whenever you add or change a component under `src/components/ui/` or a shared widget documented in [README.md](README.md).

Format: one `## YYYY-MM-DD` heading per day, one `- **ComponentName:** what changed` bullet per component.

## 2026-09-03

- **Drawer:** Mask fades in first, then the panel slides from its edge (`right` → left, `bottom` → up, and the reverse on close). Overlay stays mounted through the exit so the slide can finish. `panelClassName` sizes the positioned shell; right/left default width is on the shell, the Card is `w-full`.
- **Dialog:** Desktop open fades mask and panel together. Close fades the panel first, then the mask. Narrow viewports keep the bottom Drawer, which slides.
- **Toast:** Bottom-right stack (newest at the bottom). Card is 316px, bordered, Montserrat. `title` / `text` are `ReactNode`. Methods return `{ id, update, dismiss }` so a toast can change in place. No built-in action or progress props; `success` shows a green check on the status row.
- **Dropdown:** Placeholder text is `#606060` when nothing is selected. Optional `renderOption(option, selected)` customizes the panel row; the trigger still shows `option.label`.
- **Table:** Scroll children wrap in `min-w-full` (no `w-max`). `fr` columns size to the card so overflow can truncate; header and body stay on the same tracks. Horizontal scroll still applies when column mins exceed the card.

## 2026-09-02

- **All components:** documented the existing set (Button, Card, Dialog, Drawer, Dropdown, InputNumber, Pagination, SearchInput, Switch, Table, Toast, Tooltip, DateRangePicker). No behaviour changed.
