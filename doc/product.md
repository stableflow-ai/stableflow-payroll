# Product Map

Stableflow Pay lets a signed-in business send stablecoin payouts across EVM, Near, Solana, and Tron from a single paying wallet. Cross-chain routing goes through Near Intents (1Click) behind the backend.

The backend is the **Payroll** API: every route in `src/api/` is built from `PAY_API_PREFIX`, which is `/v1/payroll`. Auth, Single Payout, and Batch Payout have Payroll endpoints today; the other Pay screens still call paths under that prefix that the backend does not serve yet.

Only two areas are released: **Auth** and **Pay**. Everything else is either a public side page or a route that is commented out in `src/router/index.tsx`. This document details the released areas only.

## Areas

| Area | Routes | Status | Notes |
| --- | --- | --- | --- |
| Auth | `/login`, `/register` | Released | Detailed below. Reset password is a dialog, not a route. |
| Pay | `/pay`, `/pay/result`, `/pay/batch`, `/pay/pending`, `/pay/history`, `/pay/request` | Released | Detailed below. Requires a session. |
| Marketing | `/howitworks` | Live, not detailed here | Static public page linked from the auth screens. |
| Public payer | `/p/:id` | Disabled | Route commented out in `src/router/index.tsx`; `src/views/pay/RequestPayView.tsx` still exists. Anonymous page that pays a payment request created in `/pay/request`, rendered inside `AppLayout` but outside `RequireAuth`. |
| Home | `/` | Disabled | Route commented out in `src/router/index.tsx`; `src/views/home/` still exists. |
| Analytics | `/analytics` | Disabled | Route commented out; `src/views/analytics/` still exists. |
| Partner | `/partner`, `/partner/api-keys`, `/partner/reports`, `/partner/support`, `/partner/terms`, `/partner/docs` | Disabled | Routes and `PartnerLayout` commented out; `src/views/partner/` and `RequirePartner` still exist. |

Do not re-enable a disabled route, or document one here, without being asked.

Known gap: the catch-all route redirects to `/`, and `/` has no route while Home is disabled. Landing on an unknown path therefore does not resolve to a page. Signed-in entry points (`/pay` in the header logo and nav) are used instead.

## Shell

`AppLayout` (`src/layouts/AppLayout.tsx`) wraps everything except the auth screens and `/howitworks`: a 63px `AppHeader` over a `#f6f6f6` page. Pay and Partner paths render full-bleed; other paths get a centred `max-w-[1252px]` container. With only `/pay/*` enabled underneath it, the centred branch is currently unreachable.

`AppHeader` (`src/components/layout/`) holds the logo (links to `/pay`), the nav from `HEADER_NAV_ITEMS` (only `Pay` is enabled), `HeaderWalletCapsule` (multi-chain connect state), and `HeaderAccountMenu` (user, change password, log out). Below `md` the nav moves to a second scrollable row.

`PayLayout` (`src/layouts/PayLayout.tsx`) adds the Pay sidebar, the page title (the active `PAY_NAV_ITEMS` entry, falling back to `PAY_ROUTE_TITLES` for routes that are not in the sidebar), and a `setHeaderExtra` outlet context so a child view can inject a control next to the title. It also mounts `useQuickPayCommitQueue()` and `useBatchPayoutCommitQueue()`, which drain the persisted submit queues in the background.

## Auth

Files: `src/views/auth/`. Guards: `src/router/guards.tsx`. Session: `src/stores/auth.ts` + `src/lib/auth-session.ts`. API: [api.md](api.md).

Both screens share `AuthShell`: a blue brand panel (logo, headline, three feature bullets, link to `/howitworks`) beside a form card, stacking vertically below `md`. `AuthBetaBanner` sits above the login card.

| Screen | Fields | Endpoint |
| --- | --- | --- |
| `/login` | Email, password | `POST /v1/payroll/auth/login` |
| `/register` | Name, email, password, confirm password, invite code | `POST /v1/payroll/auth/register` |

Validation lives in `src/views/auth/config.ts` as pure `*RuleError` / `*FormError` functions (name ≤ 50, email ≤ 100 and pattern-checked, password 8–50, invite code ≤ 10, confirm must match). The first failing rule is shown as an error toast; the request is not sent.

**Reset password** is `ResetPasswordDialog`, opened from "Forgot Password?" on `/login` (`guest` variant) and from the header account menu (`authed` variant).

- `guest`: email → `POST /v1/payroll/reset-password/code` (60-second resend cooldown) → email + code + new password → `POST /v1/payroll/reset-password`.
- `authed`: current password + new password → `POST /v1/payroll/change-password`.

**Session.** `useLoginMutation` / `useRegisterMutation` call `applySession(token, user)`, which writes `stableflow-pay.session` to `localStorage` and updates `useAuthStore`. `useAuthStore` re-reads that key on first import, so a reload restores the session synchronously. `SessionBootstrap` in `src/App.tsx` runs `useProfileQuery()` to validate the token against `GET /v1/payroll/profile` in the background and refresh the cached user. `POST /v1/payroll/profile` (`useUpdateProfileMutation`) changes the display name; no screen uses it yet.

**Redirects.** `RequireAuth` sends anonymous visitors to `/login?returnTo=<path+search>`. `RedirectIfAuthed` sends signed-in visitors away from `/login` and `/register` to `returnTo` or `/`. After a successful login the view navigates to `returnTo ?? "/pay"`. `safeReturnTo` in `return-to.ts` rejects anything that is not a same-origin absolute path and refuses to bounce back to `/login` or `/register`.

**401.** Any authenticated request that returns 401 clears the stored session and calls `notifyUnauthorized()`, which `src/stores/auth.ts` has wired to `logout()` (clears the store and the whole TanStack Query cache). The next render hits `RequireAuth` and lands on `/login`.

## Pay

Files: `src/views/pay/`. Constants: `src/views/pay/config.ts`. Sidebar: `PaySidebar` reads `PAY_NAV_ITEMS`.

Sidebar entries: Single Payout, Batch Payout, Pending Payouts (badge = number of pending payouts), Transaction History. The Request Payment entry and its group divider are commented out, so `/pay/request` is reachable only by URL.

Shared building blocks: `TokenSelectDialog` (chain + token picker, optional balances), `PayoutsTable` (Recipient / Amount / Asset / Memo / Time / Status with an explorer link), `RecipientAddressField` + `RecipientsDialog` + `ContactFormDialog` (address book), `usePayOriginToken` and `usePaymentWallet` (paying token and matching wallet).

Amounts are limited to `AMOUNT_MAX_DECIMALS` (6) in the inputs, memos to `MEMO_MAX_LENGTH` (200), and slippage is fixed at `QUICK_PAY_SLIPPAGE_TOLERANCE` (5).

### `/pay` — Single Payout

One card: recipient address (chain detected from the address by `detectAddressChainKind`, matched against the address book), amount plus recipient token, and memo. Changing the address to another chain clears the selected token; a default USDT → USDC → first-available token for that chain is then picked by `defaultDestToken`.

The address book dialogs create, edit, and delete recipients through `useContacts` → `/v1/payroll/recipient*`.

**Send Payment** posts to `/v1/payroll/payments` (`useCreatePayrollPaymentMutation`) with the amount, the recipient, the destination `network` / `symbol` from `payoutNetworkToken`, the optional memo, and `success_url` = `{origin}/pay/result`. The backend creates a hosted checkout session and answers with `pay_url`; the browser is sent there with `window.location.assign`. Payment itself happens on the hosted checkout, so this screen never touches a wallet.

There is no notify-recipient field: the endpoint has no `notifyEmail` parameter.

### `/pay/result` — Payment Result

Where the hosted checkout returns after a **successful** payment; it is not in the sidebar, and `PAY_ROUTE_TITLES` supplies its layout title. The checkout appends `amount`, `network`, `expires_at`, `created_at`, `out_order_no`, `recipient`, `session_id`, `status`, `symbol`, `destination_txHash`, `paid_at`, and `tx_hash` to the URL; `parsePayoutCallbackParams` reads them.

`out_order_no` carries the Payroll `payment_id`, which the page passes to `GET /v1/payroll/payments/{payment_id}` (`usePayrollPaymentQuery`, read once — the checkout only returns on success, so there is nothing to poll). Until that resolves, and if it fails or `out_order_no` is missing, the page renders from the callback query alone; the memo and the paying-side amount only appear once the lookup succeeds.

The pre-checkout quote / swap / broadcast path (`useSinglePayQuote`, `useSinglePaySwap`, `transferToDepositAddress`, `enqueueQuickPayCommit`) is no longer used by this screen. `RequestPayView` still calls it. Do not delete it.

### `/pay/batch` — Batch Payout

Three page steps (`upload` → `validate` → `preview`) with a two-dot `BatchStepper` injected into the layout header.

1. **Upload.** Drop a CSV, pick a Google Sheet through the Picker, or start with one empty row. Template and accepted extensions are in `config.ts` (`IMPORT_CSV_TEMPLATE`, `IMPORT_CSV_ACCEPT`); columns are `recipient,amount,token,network,memo`. Imports are capped at `IMPORT_MAX_ROWS` (50) and the extra rows are dropped with a toast.
2. **Validate.** An editable table of drafts with per-field status. `batch-utils.ts` owns parsing, patching, per-row validation, token resolution against the 1Click token list, totals, and the per-token breakdown. The paying token is chosen here; its balance is polled every `ORIGIN_BALANCE_POLL_MS` (20s).
3. **Preview.** Totals, payout count, fee and cost from `POST /v1/payroll/batches` (`useCreatePayrollBatchQuery`, posted once when this step opens). A refresh control on the card (and an expired or already-used quote) posts again. Confirm stays disabled while the quote is stale, errored, or consumed. Confirm re-reads the wallet balance, refuses to continue when it is short of `totalSourceAmountRaw`, marks the `batchId` consumed, broadcasts through `broadcastBatchPayout`, then resets the flow. There is no submit after broadcast and no waiting page.

The paying chain is restricted to `BATCH_BLOCKCHAINS` from `src/config/chains.ts`.

### `/pay/pending` — Pending Payouts

Read-only `PayoutsTable` over `GET /v1/payroll/payments/pending`. Every row renders as Pending. The query polls every 8 seconds while the list is non-empty and stops when it drains; the same query drives the sidebar badge.

### `/pay/history` — Transaction History

Filters: address search, status (`All` / `Complete` / `Failed`), asset (`All` plus `PAYOUT_SYMBOLS`), and a `DateRangePicker` defaulting to the last 30 days. Every filter change resets to page 1, and "Clear Filter" is enabled only when something differs from the defaults.

The table is server-paginated at `HISTORY_PAGE_SIZE` (10) through `GET /v1/payroll/payments`; dates are sent as Unix seconds. Status text comes from `paymentRowStatus` (`completed`/`complete` → Complete, `failed` → Failed, anything else → Pending) and each row links to the chain explorer via `txExplorerUrl`.

"Export CSV" is injected into the layout header and calls `GET /v1/payroll/payments/export` with the same filters minus paging. The downloaded filename is the server's `Content-Disposition` name with a `yyyyMMdd-HHmmss` stamp appended.

### `/pay/request` — Request Payment

Reachable by URL only; the sidebar entry is commented out.

The merchant fills in a receiving address (auto-filled from the connected wallet for the selected token's chain), amount, token, payment name, and description, then generates a shareable `/p/:id` link through `POST /v1/payroll/request`. An advanced option switches the request to `private` mode, which activates a confidential Near Intents account (`src/lib/confidential/`) and stores a separate `private_recipient_address`.

The generated link does not resolve while the public payer route is disabled. Both halves of this flow are off the released surface; treat them as one unit if either is re-enabled.

Below the form, `ReceivedPaymentList` shows the merchant's requests with their status (`pending`, `submitted`, `completed`, `withdrawing`, `withdrawed`, `failed`), lets them disable a request (`POST /v1/payroll/request/{id}/disable`), and withdraw funds received privately (`useRequestWithdraw` → `POST /v1/payroll/request/withdraw`). `GET /v1/payroll/request/withdraw/count` polls every two minutes for the withdrawable count.

## Wallet and payout capability

`src/config/chains.ts` is the chain registry: 1Click blockchain code, display name, chain kind, EVM chain id, logo, explorer prefix, and `payerEnabled` / `batchEnabled` flags. It also maps CSV/Sheets aliases (`ethereum` → `eth`, `matic` → `pol`, and so on) so imported rows resolve.

`src/wallet/` holds one adapter per chain kind (`evm/`, `near/`, `solana/`, `tron/`) plus the shared `WalletProvider`, `transfer-deposit.ts`, `broadcast-quick-pay.ts`, and `broadcast-batch-payout.ts`. Features talk to wallets through `useWallet`, `useConnectedWallets`, and `usePaymentWallet` rather than importing an adapter directly.
