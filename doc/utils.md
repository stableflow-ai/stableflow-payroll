# Shared Utils

Generic helpers live in `src/utils/` and are re-exported from `src/utils/index.ts`.

```ts
import { formatAmount, formatAddress, formatDate, validateAddress } from "@/utils";
```

Search here before writing a helper. Feature-specific logic belongs in that feature's own `utils.ts` (for example `src/views/pay/utils.ts`, `src/views/pay/batch-utils.ts`, `src/views/pay/request-utils.ts`).

`cn()` is not part of this barrel; it stays in `src/lib/utils.ts` as the shadcn alias.

## Address — `src/utils/address.ts`

Validation and formatting for EVM, Near, Solana, and Tron. EVM uses viem, Tron uses `TronWeb.isAddress`, Solana checks the base58 alphabet and a 32-byte decode, Near uses near-sdk-js / Nomicon account ID rules (length 2–64, lowercase `a-z` / digits / `.` `-` `_`).

| Function | Notes |
| --- | --- |
| `resolveChainKind(networkOrKind)` | Normalises `"evm" \| "near" \| "solana" \| "tron"`, the aliases `sol` and `trx`, and any network name known to `src/config/chains.ts`. Returns `null` when unknown. |
| `validateAddress(address, chainKind)` | Returns `{ isValid, error? }` with a human-readable English message. Near follows near-sdk-js / Nomicon account ID rules. |
| `isAddressValid(address, chainKind)` | Boolean shortcut over `validateAddress`. |
| `normalizeAddress(address, chainKind)` | Checksums EVM addresses, lowercases Near account ids, trims the rest. Returns `null` when invalid. |
| `sameAddress(a, b, chainKind?)` | Case-insensitive comparison except on Solana and Tron, which are case-sensitive. |
| `getAddressPlaceholder(chainKind)` | Input placeholder: `0x…`, `alice.near`, `Solana address`, `T…`. |
| `formatAddress(address, prefix = 4, suffix = 5)` | Middle-ellipsis. Short non-`0x` values (Near account ids) are returned unchanged. |

`WalletChainKind` is re-exported here as an alias of `ChainKind` from `src/wallet/types.ts`.

## Amount — `src/utils/amount.ts`

`big.js` is re-exported as `Big` along with `ROUND_DOWN`, `ROUND_UP`, `ROUND_HALF_UP`, and `ROUND_HALF_EVEN`. Use them instead of floating-point arithmetic on money.

`formatAmount(value, options)` groups thousands and returns a string.

| Option | Default | Notes |
| --- | --- | --- |
| `decimals` | — | Token decimals to divide by first. Pass this for raw on-chain amounts; omit it for values that are already human-readable. |
| `maxDecimals` | `2` | Fractional digits kept after rounding. |
| `rounding` | `ROUND_DOWN` | Any `big.js` rounding mode. |
| `padDecimals` | `false` | Keep trailing zeros. |
| `showDust` | `false` | Render `<0.01` style output for non-zero values below the smallest displayable unit. |
| `prefix` | `"$"` | Pass `""` for a bare number. |

An unparseable value degrades to `0` rather than throwing.

```ts
formatAmount("1234.5678");                                  // "$1,234.56"
formatAmount(row.amount, { prefix: "", showDust: true });   // "1,234.56"
formatAmount(raw, { decimals: 6, maxDecimals: 6, prefix: "" });
```

## Date — `src/utils/date.ts`

Wrappers over `date-fns` that return `""` for an invalid input instead of throwing.

`formatDate(value, variant = "dateTime")`:

| Variant (`DATE_FORMAT`) | Pattern | Example |
| --- | --- | --- |
| `Month` | `MMM` | `Sep` |
| `MonthDay` | `MMM d` | `Sep 2` |
| `MonthDayYear` | `MMM d, yyyy` | `Sep 2, 2026` |
| `DateTime` (default) | `MMM d, yyyy HH:mm` | `Sep 2, 2026 18:35` |

`formatTimeAgo(value, now?)` returns a compact relative string that steps through seconds, minutes, hours, days, weeks, months, and years (`45 s`, `3 mins`, `2 hours`, `1 day`, `5 weeks`).

## Related helpers outside `@/utils`

These are shared but live elsewhere on purpose. Update this list when that changes.

| Helper | Location | Notes |
| --- | --- | --- |
| `cn()` | `src/lib/utils.ts` | `clsx` + `tailwind-merge` |
| Chain lookup, explorer URLs | `src/config/chains.ts` | `getChainByNetwork`, `chainDisplayName`, `txExplorerUrl`, `networkToChainId` |
| Chain / token / route logos | `src/lib/logo.ts` | Remote URLs on `assets.dapdap.net` |
| Envelope field readers | `src/api/map.ts` | `asRecord`, `apiText`, `apiNumber` |
| Date-range maths | `src/components/date-range-picker/utils.ts` | See [components/date-range-picker.md](components/date-range-picker.md) |
| Download filename stamping | `src/views/pay/utils.ts` | `stampDownloadFilename` — Pay-specific for now |
