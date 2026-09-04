# Project Structure

Stableflow Pay is a Vite 8 + React 19 single-page app. Wallet providers for EVM, Near, Solana, and Tron are wired. The authenticated shell is a 220px Pay sidebar plus a content column; the released surface is Auth and `/pay/*`.

Product areas, routes, and constraints: [product.md](product.md).

## Stack

- **Runtime:** Vite 8 (Rolldown), React 19, TypeScript 5.9
- **Styling:** Tailwind CSS 4 (`@tailwindcss/vite`, no `tailwind.config.js`), `cn()` (`clsx` + `tailwind-merge`), `class-variance-authority`
- **State:** Zustand (cross-page client state), TanStack Query (server cache). The JWT session goes through `src/lib/auth-session.ts`; nothing else touches `localStorage` / `sessionStorage`.
- **Routing:** `react-router-dom` 7 (`createBrowserRouter`)
- **Wallets:** RainbowKit + wagmi + viem (EVM), `@near-wallet-selector` (Near), `@solana/wallet-adapter` (Solana), `@tronweb3/tronwallet-adapters` (Tron)
- **Other:** `motion` (animation), `recharts` (charts), `react-toastify` (toasts), `date-fns` (dates), `big.js` (amounts), `papaparse` (CSV)
- **Tests:** Vitest (`src/**/*.test.ts`, `environment: "node"`). There is no ESLint or Prettier config; `pnpm check` and `pnpm test` are the quality gate.
- **Path alias:** `@/` → `src/`

## Scripts

```bash
pnpm install
pnpm dev        # http://127.0.0.1:5201
pnpm check      # tsc -b
pnpm test       # vitest run
pnpm build      # tsc -b && vite build
pnpm preview
```

## Environment

Copy `.env.example` to `.env.local`.

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | yes | Backend origin. The browser calls it directly; there is no Vite proxy. `http()` throws `ApiError("API base URL is not configured")` when it is empty. |
| `VITE_WALLETCONNECT_PROJECT_ID` | for wallets | Shared by RainbowKit, the Near selector, and the Tron WalletConnect adapter. |
| `VITE_RPC_PROXY_HOST`, `VITE_RPC_SECRET_KEY` | optional | HMAC-signed RPC proxy used by `src/lib/rpc/`. |
| `VITE_AMOUNT_MAX_DECIMALS` | optional | Fractional digits for amount inputs (not on-chain token decimals). |
| `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_API_KEY`, `VITE_GOOGLE_APP_ID` | for Sheets import | Google Identity + Picker + Sheets API. |
| `VITE_VIRIFY_BALANCE` | optional | Set to `"false"` to skip the pre-broadcast balance gate in `BatchPayoutView` and `RequestPayView`. Not in `.env.example`; development escape hatch only. |

## Directory map

```
public/
  logo.svg, logo-white.svg     product logos
  auth/                        auth page decoration (SVG)
  avatar/, pay/, howitwork/    page art (PNG)
src/
  main.tsx                     Buffer/process globals, QueryClientProvider, WalletProvider
  App.tsx                      RouterProvider, ToastContainer, session bootstrap
  styles.css                   Tailwind entry + fonts + toast overrides
  shadcn-tailwind.css          theme variables and @theme inline
  router/                      route table (index.tsx) and guards (guards.tsx)
  layouts/                     AppLayout, PayLayout, PartnerLayout
    views/                       one folder per area; see product.md
    auth/                      login, register, reset password
    pay/                       single, form, batch, pending, history, team, request (+ disabled public payer)
    payroll/                   payroll dashboard (mocked until the API exists)
    expense/                   expense dashboard (mocked until the API exists)
    bonus/                     bonus dashboard (mocked until the API exists)
    how-it-works/              public marketing page
    home/, analytics/, partner/  routes currently disabled
  components/
    ui/                        public primitives (see doc/components/README.md)
    ui/overlay/                internal overlay plumbing, do not import from features
    icons/                     inline SVG React components, barrel in index.tsx
    layout/                    AppHeader, HeaderAccountMenu, HeaderWalletCapsule
    date-range-picker/         shared range picker
    token-select-dialog/       shared chain + token picker
    recipient-avatar/, you-pay/, WalletConnect.tsx
  api/                         one module per domain, thin wrappers over http()
  hooks/                       use-*-api.ts (TanStack Query) plus wallet/UI hooks
  types/                       request and response types per domain
  stores/                      Zustand stores
  lib/                         http, api-error, auth-session, query-client, utils (cn),
                               logo, rpc/, google/, import/, confidential/
  utils/                       address, amount, date (barrel in index.ts)
  config/                      chains.ts (chain registry, explorers, payer/batch flags)
  mocks/                       mock switchboard; see doc/mocks.md
  wallet/                      per-chain adapters, providers, transfer + broadcast
```

## Where new code goes

| Kind | Location |
| --- | --- |
| Page / screen | `src/views/<area>/<Name>View.tsx` |
| Component used by one page | `src/views/<area>/components/<Name>.tsx` |
| Constants for one page | `src/views/<area>/config.ts` |
| Helpers for one page | `src/views/<area>/utils.ts` |
| Shared non-business primitive | `src/components/ui/<name>/<Name>.tsx` + `config.ts` |
| Shared business widget | `src/components/<widget-name>/` |
| Icon | `src/components/icons/<kebab>.tsx` + export from `index.tsx` |
| Backend call | `src/api/<domain>.ts` (see [api.md](api.md)) |
| Query / mutation hook | `src/hooks/use-<domain>-api.ts` |
| Request / response type | `src/types/<domain>.ts` |
| Cross-page client state | `src/stores/<name>.ts` |
| Reusable helper | `src/utils/<topic>.ts` + export from `index.ts` (see [utils.md](utils.md)) |
| Chain metadata | `src/config/chains.ts` |

## Stores

| Store | Persisted | Responsibility |
| --- | --- | --- |
| `auth.ts` | via `lib/auth-session.ts` | JWT `token` + `user`, `applySession`, `logout`; registers the 401 handler |
| `wallet.ts` | no | Per-chain connection state, account, modal control, `signMessage` |
| `intents-tokens.ts` | `persist` | 1Click token list, `PAYOUT_SYMBOLS`, `ensureFresh`, `findByChainAndSymbol` |
| `token-balances.ts` | no | Balance cache and fetch status per owner + asset |
| `quick-pay-prefs.ts` | `persist` | Remembered single-payout preferences |
| `quick-pay-commit-queue.ts` | `persist` | Retry queue for `POST /v1/payroll/single/submit` |
| `batch-payout-commit-queue.ts` | `persist` | Retry queue for `POST /v1/payroll/batch/submit` |
| `consumed-batches.ts` | `persist` | Spent payroll `batchId`s so the same deposit addresses are never broadcast twice |
| `nearintents-user-session.ts` | no | Near Intents session for confidential receive / withdraw |
| `google-drive-session.ts` | no | Google OAuth token for the Sheets importer |

## Import paths

```ts
import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/button/config";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table/Table";
import { IconClose } from "@/components/icons";
import { formatAmount, formatAddress } from "@/utils";
import { cn } from "@/lib/utils";
```
