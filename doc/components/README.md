# Public UI

Presentational components and shared icons come from `@stableflow/pay-ui`. The token picker comes from `@stableflow/pay-widgets/token-select`. Do not copy those implementations into this repo.

`src/styles.css` scans both packages so Tailwind keeps their classes:

```css
@source "../node_modules/@stableflow/pay-ui/dist";
@source "../node_modules/@stableflow/pay-widgets/dist";
```

| Component | Import |
| --- | --- |
| Autocomplete | `@stableflow/pay-ui/autocomplete` |
| Button | `@stableflow/pay-ui/button` |
| Card | `@stableflow/pay-ui/card` |
| DateRangePicker | `@stableflow/pay-ui/date-range-picker` |
| Dialog | `@stableflow/pay-ui/dialog` |
| Drawer | `@stableflow/pay-ui/drawer` |
| Dropdown | `@stableflow/pay-ui/dropdown` |
| InputNumber | `@stableflow/pay-ui/input-number` |
| Pagination | `@stableflow/pay-ui/pagination` |
| SearchInput | `@stableflow/pay-ui/search-input` |
| Skeleton | `@stableflow/pay-ui/skeleton` |
| Switch | `@stableflow/pay-ui/switch` |
| Table | `@stableflow/pay-ui/table` |
| Toast | `@stableflow/pay-ui/toast` |
| Tooltip | `@stableflow/pay-ui/tooltip` |
| Overlay helpers | `@stableflow/pay-ui/overlay` |
| TokenSelectDialog | `@stableflow/pay-widgets/token-select` |

Each package entry is its own subpath. There is no root barrel.

Icons are imported per file, for example `import { IconClose } from "@stableflow/pay-ui/icons/close"`. This app has no local icon components.

`PayWidgetsRoot` (`src/components/pay-widgets-root.tsx`) is the data boundary for the token picker: wallet, balances, popular tokens, and pay config. `useToast` stays in this app and renders `Toast` from `@stableflow/pay-ui/toast`.

Business widgets (`WalletConnect`, `RecipientAvatar`, Pay-local components) stay next to their feature.

When a shared component or icon changes, change it in `stableflow-pay-ui` and bump the beta here. Append a note to [CHANGELOG.md](CHANGELOG.md) when this app's usage of the package changes.
