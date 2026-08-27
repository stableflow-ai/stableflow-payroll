# Shared Utils

Import from `@/utils`. Search this module (and `src/lib/`) before writing a new helper. Only add a function here if it is reusable across features; keep feature-specific helpers next to that feature.

After adding or changing a public util, update this file.

```ts
import { formatAddress, formatAmount, formatDate } from "@/utils";
```

## Address

Path: `src/utils/address.ts`

Moved from `src/lib/address-validation.ts` and `src/lib/address.ts`.

| Function | Notes |
| --- | --- |
| `validateAddress(address, chainKind)` | `{ isValid, error? }` for EVM / Near / Solana / Tron |
| `isAddressValid(address, chainKind)` | Boolean wrapper |
| `normalizeAddress(address, chainKind)` | Checksum EVM, lowercase Near, otherwise trimmed |
| `sameAddress(a, b, chainKind?)` | Case-sensitive for Solana and Tron |
| `resolveChainKind(networkOrKind)` | Maps aliases such as `sol` / `trx` |
| `getAddressPlaceholder(chainKind)` | Input placeholder |
| `formatAddress(address, prefix?, suffix?)` | Truncates long `0x` addresses (`0x12...45678`) |

## Date

Path: `src/utils/date.ts`

Uses `date-fns`. ISO strings such as `2026-08-20T08:51:55.754Z` are parsed as `Date` and formatted in the **local** timezone. Invalid input returns `""`.

`formatDate(value, variant?)` — `DATE_FORMAT`:

| Variant | Pattern | Example |
| --- | --- | --- |
| `monthDay` | `MMM d` | `Aug 1` |
| `monthDayYear` | `MMM d, yyyy` | `Aug 1, 2026` |
| `dateTime` (default) | `MMM d, yyyy HH:mm` | `Aug 1, 2026 11:56` (24h) |

`formatTimeAgo(value, now?)` — absolute interval to `now` (default `new Date()`), largest unit only, no `ago` suffix: `45 s`, `1 min` / `10 mins`, `1 hour` / `2 hours`, then `day(s)`, `week(s)`, `month(s)`, `year(s)`.

## Amount

Path: `src/utils/amount.ts`

Uses `big.js`. Never converts through `Number` for display; uses `Big#toFixed(dp, rm)` so the result is not scientific notation.

`formatAmount(value, options?)` — `value` is `string | number | Big`.

| Option | Default | Notes |
| --- | --- | --- |
| `decimals` | — | Treat `value` as minor units: `value / 10^decimals` |
| `maxDecimals` | `2` | Decimal places passed to `toFixed` |
| `rounding` | `ROUND_DOWN` (`Big.roundDown`) | Second argument of `toFixed` |
| `padDecimals` | `false` | `true` → `$1.50`; `false` → `$1.5` |
| `showDust` | `false` | If `0 < abs(value) < 10^(-maxDecimals)`, return `$ <0.01` or `<0.01` when `prefix` is empty |
| `prefix` | `"$"` | |

Rounding constants (same values as `Big.round*`): `ROUND_DOWN`, `ROUND_UP`, `ROUND_HALF_UP`, `ROUND_HALF_EVEN`. `Big` is also re-exported.

```ts
import { Big, formatAmount, ROUND_UP } from "@/utils";

formatAmount("1.239", { maxDecimals: 2 }); // $1.23
formatAmount("1.231", { maxDecimals: 2, rounding: ROUND_UP }); // $1.24
formatAmount("1000000", { decimals: 6, maxDecimals: 2, padDecimals: true }); // $1.00
```

Invalid input formats as zero (`$0` / `$0.00` when padded). Negative amounts keep the sign after the prefix: `$-1.23`.
