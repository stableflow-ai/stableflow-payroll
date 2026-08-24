# Product Map

Stableflow Pay is a confidential stablecoin payout product. There are **no roles** (no admin, employee, or organization). Recipients are **wallet addresses**, not employees.

Read this before adding pages or navigation. Page UI and APIs are specified when each screen is built. Routes marked *planned* are not in the router yet.

The previous app (`stableflow-pay-old`) is a visual and payout-flow reference only. Do not copy employee, org, or invite-onboarding flows.

## Areas

| Area | Routes | Status | Notes |
| --- | --- | --- | --- |
| Auth | `/login`, `/register` | shipped | Email + password. Register body: `name`, `email`, `password`, `inviteCode`. Guest forgot password: email, verification code, and new password in a dialog. Authed users reset from the header avatar menu. APIs are not wired yet. |
| Marketing | `/howitworks` | shipped | Public. Linked from the auth shell. |
| Home | `/` | shipped | Dashboard: summary, charts, pending. Behind `RequireAuth` + `AppLayout`. Data is mock until the API exists. |
| Pay | `/pay`, `/pay/batch`, `/pay/pending`, `/pay/history`, `/pay/request` | in progress | See [Pay](#pay). Pending list uses `GET /v1/pay/payments/pending`. History is mock until the API exists. |
| Analytics | `/analytics` | planned | More charts on one page. |
| Partner | `/partner/api-keys`, `/partner/reports`, `/partner/support`, `/partner/terms`, `/partner/docs` | planned | See [Partner](#partner). |

## Auth

- Login: `email` + `password`.
- Register: `name` (max 50), `email`, `password` (8–50), `inviteCode` (max 10).
- Session: Zustand `useAuthStore` + `localStorage`. Types: `AuthUser` (`id`, `email`, `name`) — no `role` or `org_id`.
- Unauthenticated `/` redirects to `/login`. Authenticated `/login` or `/register` redirects to `/`.
- After login or register, navigate to `/`.
- Reset password:
  - Guest: Login `Forgot Password?` opens a dialog (email, verification code, new password, confirm). Continue verifies the code and sets the password, then closes back to login (APIs not wired).
  - Authed: header avatar menu opens `ResetPasswordDialog` (`variant="authed"`).
  - Send-code / verify-code / change-password APIs are not wired yet.

Guards live in `src/router/guards.tsx`: `RequireAuth`, `RedirectIfAuthed`. Do not add admin/employee guards.

## Home

One authenticated page at `/`. Summary, payment volume chart, pending payouts, and recent payouts. Shared chrome is `AppLayout` + `AppHeader`, not the page itself. Dashboard numbers currently come from `src/mocks/home.ts` (see [mocks.md](mocks.md)).

## Pay

`PayLayout` secondary nav (left sidebar on desktop, horizontal chips on mobile):

| Menu | Route | Notes |
| --- | --- | --- |
| Single Payout | `/pay` | One address, one payment. Recipients address book is a dialog on this page (mock data). |
| Batch Payout | `/pay/batch` | CSV / Google Sheets / manual rows. Validate then preview. `POST /v1/pay/batch/quote\|swap\|submit`. Recipients are wallet addresses. |
| Request Payment | `/pay/request` | Create a payment request (receiving address, amount, token, optional private receive). Received Payment list is mock until the API exists. Payer-open `/pay?request=:id` is planned. |
| Pending Payouts | `/pay/pending` | In-flight payouts from `GET /v1/pay/payments/pending`. Sidebar badge is the list length. |
| Transaction History | `/pay/history` | Mock list until the API exists. Search, status/asset/time filters, pagination. Export CSV is UI-only. |

Single payout uses `POST /v1/pay/quick/quote|swap|submit`. Batch payout uses `POST /v1/pay/batch/quote|swap|submit`. Origin broadcast is EVM-only. Recipients are wallet addresses (not employees). The address book is not a route.

Request Payment (`/pay/request`) lets the logged-in user set a receiving address (autofilled from the connected wallet for the selected token chain), amount, dest token, optional description, and **Receive Privately**. Private receive signs an empty-intents MultiPayload (V1 versioned nonce from `intents.near` `current_salt`) on the matching chain wallet, then `POST https://1click.chaindefuser.com/v0/auth/authenticate` to store a User-Session (refresh via `/v0/auth/refresh`). Generate Payment Link and Withdraw are UI-only until product APIs exist.

Payer-open of a request link is **planned**: `/pay?request=:id` on Single Payout (must be logged in; unauthenticated → `/login?returnTo=`). Non-private reuses quick quote/swap/submit; private uses `recipientType: CONFIDENTIAL_INTENTS`. Do not change Login / guards until that API exists.

## Analytics

One authenticated page at `/analytics` with additional charts beyond Home.

## Partner

For SDK users. Submenus:

| Menu | Route | Access |
| --- | --- | --- |
| API Keys | `/partner/api-keys` | Only after the user is a Partner. Default landing once they are. |
| Reports | `/partner/reports` | Only after the user is a Partner. API key usage analytics. |
| Support | `/partner/support` | Contact. Always available. |
| Terms of Service | `/partner/terms` | Always available. |
| Developer Docs | `/partner/docs` | Always available. |

Until Partner status is active, API Keys and Reports must not open. After the user is a Partner, hide the registration form; do not show it again. Partner status comes from the API.

Registration fields (when that screen is built):

| Field | Constraints |
| --- | --- |
| `first_name` | required, max 100 |
| `last_name` | required, max 100 |
| `company` | required, max 255, default `""` |
| `website` | required, max 500, default `""` |
| `telegram` | required, max 128, default `""` |
| `purpose` | optional, max 5000, default `""` |

## Routing today

```
/login            RedirectIfAuthed → LoginView
/register         RedirectIfAuthed → RegisterView
/howitworks       public → HowItWorksView
/                 RequireAuth → AppLayout → HomeView
/pay              RequireAuth → AppLayout → PayLayout → SinglePayoutView
/pay/batch        PayLayout → BatchPayoutView
/pay/request      PayLayout → RequestPaymentView
/pay/pending      PayLayout → PendingPayoutsView
/pay/history      PayLayout → TransactionHistoryView
*                 → /
```
