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
| Pay | `/pay`, `/pay/batch`, `/pay/pending`, `/pay/history`, `/pay/request`, `/pay/contacts` | planned | See [Pay](#pay). |
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

Secondary nav:

| Menu | Route | Notes |
| --- | --- | --- |
| Single Payout | `/pay` | One address, one payment. |
| Batch Payout | `/pay/batch` | CSV import, Google Sheets import, and a manual editable table. |
| Pending Payouts | `/pay/pending` | |
| Transaction History | `/pay/history` | |
| Request Payment | `/pay/request` | |
| Address book | `/pay/contacts` | Saved addresses (not employees). |

Payout execution (single and batch) already exists in `stableflow-pay-old` (`quick-pay`, `batch-payout`, `import-payout`, `payout-flow`). Port those flows later: drop employee / org fields, keep **address** as the payee.

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
*                 → /
```
