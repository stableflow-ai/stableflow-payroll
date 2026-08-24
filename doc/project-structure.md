# Project Structure

Stableflow Pay is a Vite 8 + React 19 frontend for confidential USDC/USDT payouts. There are no admin/employee roles. Wallet providers for EVM, Near, Solana, and Tron are wired; most product pages are still being built.

Product areas, planned routes, and constraints: [product.md](product.md).

## Stack

- **Runtime:** Vite 8 (Rolldown), React 19, TypeScript
- **Styling:** Tailwind CSS 4, `cn()` (`clsx` + `tailwind-merge`), `class-variance-authority`
- **State:** Zustand (wallet + auth session), TanStack Query (server cache)
- **Routing:** `react-router-dom`
- **Path alias:** `@/` → `src/`

## Scripts

```bash
pnpm install
pnpm dev        # http://127.0.0.1:5200
pnpm check      # tsc -b
pnpm test       # vitest
pnpm build
pnpm preview
```

## Directory map

```
src/
  App.tsx                 # Router + toast container
  main.tsx                # Boot: Buffer polyfill, QueryClient, WalletProvider
  styles.css              # Tailwind entry, fonts, global tokens
  router/                 # Route table + auth guards (no roles)
  views/
    auth/                 # Login, register, AuthShell, ResetPasswordDialog
    how-it-works/         # Public marketing page
    home/                 # Authenticated Home dashboard
    analytics/            # Authenticated Analytics page
    pay/                  # Pay layout pages (Single, Batch, Request, Pending, History)
    partner/              # Partner layout pages (registration, API keys, reports, placeholders)
  layouts/                # AppLayout (header + outlet), PayLayout / PartnerLayout (sidebar)
  components/
    ui/                   # Public, non-business UI (see doc/components)
    icons/                # Shared SVG icon components
    layout/               # AppHeader, wallet capsule, account menu
    WalletConnect.tsx     # Wallet connect dialog (business)
  hooks/                  # Shared hooks (`use-wallet`, `use-auth-api`, `use-toast`, `use-media-query`, `use-payout-api`, `use-analytics-api`, `use-partner`, `use-partner-reports`)
  wallet/                 # Multi-chain wallet adapters and providers
  stores/                 # Zustand stores (wallet, auth session, nearintents-user-session)
  api/                    # Backend wrappers by domain (`auth.ts`, `nearintents.ts`, `config.ts`, `query-keys.ts`)
  types/                  # Shared API / domain types
  mocks/                  # UI fixtures while an API contract is missing — see doc/mocks.md
  lib/                    # Infra: HTTP client, QueryClient, RPC, `cn()`, logo URLs
  utils/                  # Shared helpers (address, date, amount) — see doc/utils.md
  config/                 # App-level config (chains)
doc/                      # Agent-facing docs (English)
```

## Where new code goes

| Kind | Location |
| --- | --- |
| Public UI primitive | `src/components/ui/<name>/` + `doc/components/<name>.md` |
| Icon | `src/components/icons/` and re-export from `index.tsx` |
| Page | `src/views/` + register in `src/router/index.tsx` |
| Feature widget | `src/components/<feature>/` (not under `ui/`) |
| Hook | `src/hooks/` |
| API function | `src/api/<domain>.ts` — call `http()` only; see [api.md](api.md) |
| API types | `src/types/<domain>.ts` |
| Query keys | `src/api/query-keys.ts` |
| Zustand store | `src/stores/` — session / global UI, not server lists |
| Shared util | `src/utils/` + [doc/utils.md](utils.md) |
| Infra helper (`cn`, HTTP, RPC, logo) | `src/lib/` |
| Constants for a module | sibling `config.ts` |
| Mock fixtures (API not ready) | `src/mocks/<domain>.ts` + [mocks.md](mocks.md) |

## Public UI import paths

Import from the component file (no barrel file):

```ts
import { Button } from "@/components/ui/button/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";
```

Shared utils use the barrel:

```ts
import { formatAmount, formatDate, isAddressValid } from "@/utils";
```
