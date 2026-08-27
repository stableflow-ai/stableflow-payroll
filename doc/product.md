# Product Map

Stableflow Pay is a confidential stablecoin payout product. There are **no roles** (no admin, employee, or organization). Recipients are **wallet addresses**, not employees.

Read this before adding pages or navigation. Page UI and APIs are specified when each screen is built. Routes marked *planned* are not in the router yet.

The previous app (`stableflow-pay-old`) is a visual and payout-flow reference only. Do not copy employee, org, or invite-onboarding flows.

## Areas

| Area | Routes | Status | Notes |
| --- | --- | --- | --- |
| Auth | `/login`, `/register` | shipped | Email + password. Register body: `name`, `email`, `password`, `inviteCode`. Guest forgot password: email, verification code, and new password in a dialog. Authed users change password from the header avatar menu. |
| Marketing | `/howitworks` | shipped | Public. Linked from the auth shell. |
| Home | `/` | shipped | Dashboard: summary, charts, pending. Behind `RequireAuth` + `AppLayout`. Overview, volume, pending, and recent use `/v1/pay/*`. Balance is summed on-chain from connected payer-chain tokens (`PAYOUT_SYMBOLS`, USD via token price). |
| Pay | `/pay`, `/pay/batch`, `/pay/pending`, `/pay/history`, `/pay/request` | in progress | See [Pay](#pay). Pending list uses `GET /v1/pay/payments/pending`. History uses `GET /v1/pay/payments`. Address book uses `/v1/pay/recipient*`. |
| Analytics | `/analytics` | shipped | Month selector, Total Payment chart (`/v1/pay/payments/volume`, day/week/month), latest payouts (`/payments/recent`), calendar / asset mix / networks from `GET /v1/pay/analytics`. Shows a skeleton while analytics loads. |
| Partner | `/partner`, `/partner/api-keys`, `/partner/reports`, `/partner/support`, `/partner/terms`, `/partner/docs` | shipped | See [Partner](#partner). Registration and API Keys use `/v1/pay/partner*`. Reports use `/v1/pay/partner/analytics` and `/v1/pay/partner/payments`. Support / Terms / Docs are placeholders. |

## Auth

- Login: `email` + `password`.
- Register: `name` (max 50), `email` (max 100), `password` (8–50), confirm password must match, `inviteCode` (max 10).
- Session: Zustand `useAuthStore` + `localStorage`. Types: `AuthUser` (`id`, `email`, `name`) — no `role` or `org_id`.
- Unauthenticated `/` redirects to `/login`. Authenticated `/login` or `/register` redirects to `/`, or to a safe `returnTo` query when present.
- After login or register, navigate to a safe `returnTo` (in-app path with search) or `/`.
- Boot: hydrate `{ token, user }` from `localStorage`, then `GET /v1/pay/profile` in the background. HTTP 401 logs the user out. Navigation is not blocked while the profile request is in flight.
- Reset password:
  - Guest: Login `Forgot Password?` opens a dialog. Send Code calls `POST /v1/pay/reset-password/code`. Continue calls `POST /v1/pay/reset-password` (`email`, `code`, `newPassword`), then closes back to login.
  - Authed: header avatar menu opens `ResetPasswordDialog` (`variant="authed"`). Continue calls `POST /v1/pay/change-password` (`currentPassword`, `newPassword`). The session stays; the dialog closes.

Guards live in `src/router/guards.tsx`: `RequireAuth`, `RedirectIfAuthed`, `RequirePartner`. Do not add admin/employee guards.

## Home

One authenticated page at `/`. Summary, payment volume chart, pending payouts, and recent payouts. Shared chrome is `AppLayout` + `AppHeader`, not the page itself. Total Payment and Recipients come from `GET /v1/pay/overview`. Volume uses `GET /v1/pay/payments/volume` (`day` / `week` / `month`). Pending and recent lists use `/v1/pay/payments/pending` and `/recent` (max 6). Balance is summed client-side from connected wallets on `payerEnabled` chains (USD uses `/v0/tokens` prices). Token chips are display-only.

## Pay

`PayLayout` secondary nav (left sidebar on desktop, horizontal chips on mobile). Desktop sidebar shows a **Payout** group label, then Single / Batch / Pending / History, a divider, then Request Payment.

| Menu | Route | Notes |
| --- | --- | --- |
| Single Payout | `/pay` | One address, one payment. Recipients address book is a dialog on this page (`/v1/pay/recipient*`). Origin tokens are limited to `payerEnabled` chains. |
| Batch Payout | `/pay/batch` | CSV / Google Sheets / manual rows. Validate then preview. `POST /v1/pay/batch/quote\|swap\|submit`. Recipients are wallet addresses. Origin tokens are EVM ERC-20 on `batchEnabled` chains (no native gas tokens). |
| Pending Payouts | `/pay/pending` | In-flight payouts from `GET /v1/pay/payments/pending`. Amount/Asset use destination fields. Time uses `submitted_at`. Sidebar badge is the list length. |
| Transaction History | `/pay/history` | `GET /v1/pay/payments`. Search `q`, status `completed`/`failed`, token from `PAYOUT_SYMBOLS`, `start_time`/`end_time` unix seconds via DateRangePicker. Export CSV calls `GET /v1/pay/payments/export` with the same filters (no pagination). |
| Request Payment | `/pay/request` | Create a payment request (receiving address, amount, dest token, required payment name, optional description, optional private receive). Generate Payment Link calls `POST /v1/pay/request` and copies `/p/:id`. The list uses `GET /v1/pay/request/list` (manual refresh, 30s cooldown). Sidebar badge uses `GET /v1/pay/request/withdraw/count` (120s poll). Pending rows can be disabled via `POST /v1/pay/request/{id}/disable`. |

Single payout uses `POST /v1/pay/single/quote|swap|submit`. Swap returns `depositAddress`; the connected origin wallet transfers `amountIn` to that address (native or token, EVM / Solana / Near / Tron). Memo and notify-recipient email are sent on swap only, not on quote. Batch payout uses `POST /v1/pay/batch/quote|swap|submit`. Batch origin broadcast is EVM ERC-20 only (`batchEnabled` on `FIXED_CHAINS`); it still uses `approvals` + `callData`. Recipients are wallet addresses (not employees). The address book is not a route.

Request Payment (`/pay/request`) lets the logged-in user set a receiving address (autofilled from the connected wallet for the selected token chain), amount, dest token, required **Payment Name** (`name`, max 50), optional description (`memo`), and **Receive Privately**. Private receive signs an empty-intents MultiPayload (V1 versioned nonce from `intents.near` `current_salt`) on the matching chain wallet, then `POST https://1click.chaindefuser.com/v0/auth/authenticate` to store a Near Intents User-Session in `useNearintentsUserSessionStore` (refresh via `/v0/auth/refresh`). Generate Payment Link calls `POST /v1/pay/request` and copies `/p/{id}`. The public payer page (`/p/:id`, AppHeader, no Pay sidebar, no login required) loads `GET /v1/pay/request/{id}` with Bearer only when a session exists. Pending requests can be paid with `POST /v1/pay/single/quote|swap|submit` plus `request_id` (same guest-auth rule). If that GET fails or `status` is not `pending`, the coupon shows the deleted state. After Pay Now succeeds, the same page shows the paid state. The Request Payment list uses `GET /v1/pay/request/list` when the page opens (no poll; Refresh is limited to once per 30s). Columns: Payment Name, Request Payment, Receive Address (`Private` when `mode=private`), Paid Address (`payer`), Paid Time (`paid_at`), Status, actions. Received rows link `destination_tx_hash`; withdrawed rows link `withdraw_tx_hash`. Copy link and delete are pending-only. Delete confirms then calls `POST /v1/pay/request/{id}/disable`. The Pay sidebar (and the list “To be withdraw” badge) uses `GET /v1/pay/request/withdraw/count` every 120s. Withdraw uses `/v1/nearintents/quote` then `generate-intent`, wallet-signs the payload, then `POST /v1/pay/request/withdraw` and refetches the list once. The Withdraw button is only for `mode=private` and `status=completed`.

Back on `/p/:id` goes to `/`. Unauthenticated `/` still redirects to `/login?returnTo=`. After login or register, that `returnTo` is used when it is a safe in-app path.

## Analytics

One authenticated page at `/analytics`. Title-row year-month picker (year arrows + 12-month grid, trigger `YYYY MMM`) drives `GET /v1/pay/analytics` (stats, Payment Calendar, Asset Distribution, Payout Networks top 5). Total Payment bars use Daily / Weekly / Monthly via `GET /v1/pay/payments/volume`. Latest Payouts uses `GET /v1/pay/payments/recent`. The page shows a skeleton while analytics is loading.

## Partner

For SDK users. Submenus:

| Menu | Route | Access |
| --- | --- | --- |
| API Keys | `/partner/api-keys` | Only after the user is a Partner. Default landing once they are. |
| Reports | `/partner/reports` | Only after the user is a Partner. Top time / API key / network filters drive volume stats and charts (`GET /v1/pay/partner/analytics`). A paginated usage table has its own API key / source / destination / amount filters (`GET /v1/pay/partner/payments`). |
| Support | `/partner/support` | Contact. Always available. |
| Terms of Service | `/partner/terms` | Always available. |
| Developer Docs | `/partner/docs` | Always available. |

Until Partner status is active, API Keys and Reports must not open. Header **Developer** goes to `/partner`: registration when the user is not a Partner, `/partner/api-keys` after they are. After the user is a Partner, hide the registration form; do not show it again. Partner status comes from `GET /v1/pay/partner` (`null` or empty data means not a Partner). API keys use `/v1/pay/partner/keys`. Reports stats use `GET /v1/pay/partner/analytics`; the table uses `GET /v1/pay/partner/payments`.

Registration fields:

| Field | Constraints |
| --- | --- |
| `first_name` | required, max 100 |
| `last_name` | required, max 100 |
| `company` | required, max 255 |
| `purpose` | required, max 5000 |
| `website` | optional, max 500, default `""` |
| `telegram` | optional, max 128, default `""` |
| `description` | optional, max 5000, default `""`. UI label is Additional Details. |

## Routing today

```
/login            RedirectIfAuthed → LoginView
/register         RedirectIfAuthed → RegisterView
/howitworks       public → HowItWorksView
/p/:id            AppLayout (no auth) → RequestPayView
/                 RequireAuth → AppLayout → HomeView
/analytics        RequireAuth → AppLayout → AnalyticsView
/pay              RequireAuth → AppLayout → PayLayout → SinglePayoutView
/pay/batch        PayLayout → BatchPayoutView
/pay/request      PayLayout → RequestPaymentView
/pay/pending      PayLayout → PendingPayoutsView
/pay/history      PayLayout → TransactionHistoryView
/partner          PartnerLayout → PartnerRegistrationView (redirects to api-keys if Partner)
/partner/api-keys RequirePartner → ApiKeysView
/partner/reports  RequirePartner → ReportsView
/partner/support  PartnerPlaceholderView
/partner/terms    PartnerPlaceholderView
/partner/docs     PartnerPlaceholderView
*                 → /
```
