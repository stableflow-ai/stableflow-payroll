# Component Changelog

Newest first. Add an entry whenever you add or change a component under `src/components/ui/` or a shared widget documented in [README.md](README.md).

Format: one `## YYYY-MM-DD` heading per day, one `- **ComponentName:** what changed` bullet per component.

## 2026-09-03

- **Dropdown:** Placeholder text is `#606060` when nothing is selected. Optional `renderOption(option, selected)` customizes the panel row; the trigger still shows `option.label`.
- **Table:** Scroll children wrap in `min-w-full` (no `w-max`). `fr` columns size to the card so overflow can truncate; header and body stay on the same tracks. Horizontal scroll still applies when column mins exceed the card.

## 2026-09-02

- **All components:** documented the existing set (Button, Card, Dialog, Drawer, Dropdown, InputNumber, Pagination, SearchInput, Switch, Table, Toast, Tooltip, DateRangePicker). No behaviour changed.
