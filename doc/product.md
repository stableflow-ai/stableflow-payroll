# Product Map

Stableflow Pay is a confidential stablecoin payout product. There are **no roles** (no admin, employee, or organization). Recipients are **wallet addresses**, not employees.

Read this before adding pages or navigation. Page UI and APIs are specified when each screen is built. Routes marked *planned* are not in the router yet.

The previous app (`stableflow-pay-old`) is a visual and payout-flow reference only. Do not copy employee, org, or invite-onboarding flows.

## Areas

| Area | Routes | Status | Notes |
| --- | --- | --- | --- |
| Auth | `/login`, `/register` | shipped | Email + password. Register body: `name`, `email`, `password`, `inviteCode`. Guest forgot password: email, verification code, and new password in a dialog. Authed users change password from the header avatar menu. |
| Marketing | `/howitworks` | shipped | Public. Linked from the auth shell. |
| Home | `/` | shipped | Dashboard: summary, charts, pending. Behind `RequireAuth` + `AppLayout`. Overview, volume, pending, and recent use `/v1/pay/*`. Balance is summed on-chain from connected payer-chain USDT/USDC. |
| Pay | `/pay`, `/pay/batch`, `/pay/pending`, `/pay/history`, `/pay/request` | in progress | See [Pay](#pay). Pending list uses `GET /v1/pay/payments/pending`. History uses `GET /v1/pay/payments`. Address book uses `/v1/pay/recipient*`. |
| Analytics | `/analytics` | shipped | Month selector, Total Payment chart (`/v1/pay/payments/volume`, day/week/month), latest payouts (`/payments/recent`), calendar / asset mix / networks from `GET /v1/pay/analytics`. Shows a skeleton while analytics loads. |
| Partner | `/partner`, `/partner/api-keys`, `/partner/reports`, `/partner/support`, `/partner/terms`, `/partner/docs` | shipped | See [Partner](#partner). Registration, API Keys, and Reports are mock until the API exists. Support / Terms / Docs are placeholders. |

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

Guards live in `src/router/guards.tsx`: `RequireAuth`, `RedirectIfAuthed`. Do not add admin/employee guards.

## Home

One authenticated page at `/`. Summary, payment volume chart, pending payouts, and recent payouts. Shared chrome is `AppLayout` + `AppHeader`, not the page itself. Total Payment and Recipients come from `GET /v1/pay/overview`. Volume uses `GET /v1/pay/payments/volume` (`day` / `week` / `month`). Pending and recent lists use `/v1/pay/payments/pending` and `/recent` (max 6). Balance is summed client-side from connected wallets on `payerEnabled` chains.

## Pay

`PayLayout` secondary nav (left sidebar on desktop, horizontal chips on mobile):

| Menu | Route | Notes |
| --- | --- | --- |
| Single Payout | `/pay` | One address, one payment. Recipients address book is a dialog on this page (`/v1/pay/recipient*`). Origin tokens are limited to `payerEnabled` chains. |
| Batch Payout | `/pay/batch` | CSV / Google Sheets / manual rows. Validate then preview. `POST /v1/pay/batch/quote\|swap\|submit`. Recipients are wallet addresses. Origin tokens are limited to `payerEnabled` chains. |
| Request Payment | `/pay/request` | Create a payment request (receiving address, amount, token, optional private receive). Generate Payment Link builds `/pay?addr=&amount=&token=&network=&uid=` (optional `memo`, `private=1`). Received Payment list and pending-withdraw count are mock until those APIs exist. |
| Pending Payouts | `/pay/pending` | In-flight payouts from `GET /v1/pay/payments/pending`. Amount/Asset use destination fields. Time uses `submitted_at`. Sidebar badge is the list length. |
| Transaction History | `/pay/history` | `GET /v1/pay/payments`. Search `q`, status `completed`/`failed`, token USDT/USDC, `start_time`/`end_time` unix seconds via DateRangePicker. Export CSV is UI-only. |

Single payout uses `POST /v1/pay/single/quote|swap|submit`. Memo and notify-recipient email are sent on swap only, not on quote. Batch payout uses `POST /v1/pay/batch/quote|swap|submit`. Origin broadcast is EVM-only (`payerEnabled` on `FIXED_CHAINS`). Recipients are wallet addresses (not employees). The address book is not a route.

Request Payment (`/pay/request`) lets the logged-in user set a receiving address (autofilled from the connected wallet for the selected token chain), amount, dest token, optional description, and **Receive Privately**. Private receive signs an empty-intents MultiPayload (V1 versioned nonce from `intents.near` `current_salt`) on the matching chain wallet, then `POST https://1click.chaindefuser.com/v0/auth/authenticate` to store a Near Intents User-Session in `useNearintentsUserSessionStore` (refresh via `/v0/auth/refresh`). Generate Payment Link concatenates payer params onto `/pay?...`. The payer must be logged in (`/login?returnTo=` keeps pathname + search). Single Payout prefills and locks address / amount / dest token, sends `request_user_id`, and when private adds `mode: "private"` plus `privateDestinationAddress` (intentsAccountId). After a successful send, the query is `replace`d away. Withdraw uses `/v1/nearintents/quote` then `generate-intent`, wallet-signs the returned payload, then `submit-intent` / `status` until the product withdraw-submit API records the row.

Unauthenticated visits to a payment link go to `/login?returnTo=` (pathname + search). After login or register, that `returnTo` is used when it is a safe in-app path.

## Analytics

One authenticated page at `/analytics`. Title-row year-month picker (year arrows + 12-month grid, trigger `YYYY MMM`) drives `GET /v1/pay/analytics` (stats, Payment Calendar, Asset Distribution, Payout Networks top 5). Total Payment bars use Daily / Weekly / Monthly via `GET /v1/pay/payments/volume`. Latest Payouts uses `GET /v1/pay/payments/recent`. The page shows a skeleton while analytics is loading.

## Partner

For SDK users. Submenus:

| Menu | Route | Access |
| --- | --- | --- |
| API Keys | `/partner/api-keys` | Only after the user is a Partner. Default landing once they are. |
| Reports | `/partner/reports` | Only after the user is a Partner. Time / API key / network filters, volume and transaction charts, and a paginated usage table. Mock until the API exists. |
| Support | `/partner/support` | Contact. Always available. |
| Terms of Service | `/partner/terms` | Always available. |
| Developer Docs | `/partner/docs` | Always available. |

Until Partner status is active, API Keys and Reports must not open. Header **Developer** goes to `/partner`: registration when the user is not a Partner, `/partner/api-keys` after they are. After the user is a Partner, hide the registration form; do not show it again. Partner status is mock until the API exists.

Registration fields:

| Field | Constraints |
| --- | --- |
| `first_name` | required, max 100 |
| `last_name` | required, max 100 |
| `company` | required, max 255 |
| `purpose` | required, max 5000 |
| `website` | optional, max 500, default `""` |
| `telegram` | optional, max 128, default `""` |
| `additional_details` | optional, max 5000, default `""` |

## Routing today

```
/login            RedirectIfAuthed → LoginView
/register         RedirectIfAuthed → RegisterView
/howitworks       public → HowItWorksView
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
