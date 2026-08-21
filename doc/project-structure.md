# Project Structure

Stableflow Pay is a Vite 8 + React 19 frontend for USDC/USDT payroll. Wallet providers for EVM, Near, Solana, and Tron are wired; product pages and APIs are still being built.

## Stack

- **Runtime:** Vite 8 (Rolldown), React 19, TypeScript
- **Styling:** Tailwind CSS 4, `cn()` (`clsx` + `tailwind-merge`), `class-variance-authority`
- **State:** Zustand (wallet store), TanStack Query
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
  router/                 # Route table
  views/                  # Route-level pages (currently PlaceholderHome)
  components/
    ui/                   # Public, non-business UI (see doc/components)
    icons/                # Shared SVG icon components
    WalletConnect.tsx     # Wallet connect dialog (business)
  hooks/                  # Shared hooks (`use-wallet`, `use-media-query`)
  wallet/                 # Multi-chain wallet adapters and providers
  stores/                 # Zustand stores
  lib/                    # Infra: RPC clients, `cn()`, logo URLs
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
| Shared util | `src/utils/` + [doc/utils.md](utils.md) |
| Infra helper (`cn`, RPC, logo) | `src/lib/` |
| Constants for a module | sibling `config.ts` |

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
