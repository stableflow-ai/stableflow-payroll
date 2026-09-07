# Product Map

Stableflow Pay lets a signed-in business send stablecoin payouts across EVM, Near, Solana, and Tron from a single paying wallet. Cross-chain routing goes through Near Intents (1Click) behind the backend.

The backend is the **Payroll** API: every route in `src/api/` is built from `PAY_API_PREFIX`, which is `/v1/payroll`. Auth, Single Payout, and Batch Payout have Payroll endpoints today; the other Pay screens still call paths under that prefix that the backend does not serve yet.

Only two areas are released: **Auth** and **Pay**. Everything else is either a public side page or a route that is commented out in `src/router/index.tsx`. This document details the released areas only.

## Areas

| Area | Routes | Status | Notes |
| --- | --- | --- | --- |
| Auth | `/login`, `/register`, `/invite/:orgId` | Released | Detailed below. Reset password is a dialog, not a route. |
| Pay | `/`, `/pay`, `/pay/form`, `/pay/result`, `/pay/payroll`, `/pay/batch`, `/pay/expense`, `/pay/bonus`, `/pay/team`, `/pay/history`, `/pay/setting`, `/pay/pending`, `/pay/request`, `/pay/requests` | Released | Detailed below. Requires a session. Overview is `/` (`/pay/overview` redirects there). `/pay/reimbursement` redirects to `/pay/expense`. |
| Marketing | `/howitworks` | Live, not detailed here | Static public page linked from the auth screens. |
| Public payer | `/p/:id` | Disabled | Route commented out in `src/router/index.tsx`; `src/views/pay/RequestPayView.tsx` still exists. Anonymous page that pays a payment request created in `/pay/request`, rendered inside `AppLayout` but outside `RequireAuth`. |
| Home | — | Disabled | `src/views/home/` still exists; do not re-enable `HomeView`. `/` is Pay Overview, not Home. |
| Analytics | `/analytics` | Disabled | Route commented out; `src/views/analytics/` still exists. |
| Partner | `/partner`, `/partner/api-keys`, `/partner/reports`, `/partner/support`, `/partner/terms`, `/partner/docs` | Disabled | Routes and `PartnerLayout` commented out; `src/views/partner/` and `RequirePartner` still exist. |

Do not re-enable a disabled route, or document one here, without being asked.

`/` is Overview inside `PayLayout`. Unmatched paths redirect to `/`. Unsigned visitors then hit `RequireAuth` and land on `/login?returnTo=/`.

## Shell

`AppLayout` (`src/layouts/AppLayout.tsx`) wraps everything except the auth screens and `/howitworks`. On `/` and `/pay/*` it is a `#f6f6f6` page with no top header; PayLayout owns the chrome. Partner paths are still full-bleed. Other paths get a centred `max-w-[1252px]` container plus `AppHeader`. With only Pay enabled underneath it, the centred branch is currently unreachable.

`AppHeader` (`src/components/layout/`) is unused on `/` and `/pay/*`. It still holds the logo, `HEADER_NAV_ITEMS`, `HeaderWalletCapsule`, and the capsule variant of `HeaderAccountMenu` for a future Home / Analytics shell.

`PayLayout` (`src/layouts/PayLayout.tsx`) is the authenticated Pay chrome: a 220px left sidebar (`PaySidebar`) with a right divider, a content header (page title from `payTitleForPath`, optional `setHeaderExtra`, and `HeaderWalletCapsule` on the right) with a full-width bottom border, and `PaymentModeTabs` on `/pay` and `/pay/form` for **admin** only (below the header rule). It also mounts `useQuickPayCommitQueue()` and `useBatchPayoutCommitQueue()`, which drain the persisted submit queues in the background. Below `lg` the sidebar is hidden. A compact top row shows the logo (links to `/`), the organization name (`user.organization.name`) stacked above the account menu (avatar, name, dropdown), and a menu button on the right that opens a top Drawer with the role-filtered nav. The wallet capsule is desktop-only.

`PaySidebar` (`src/views/pay/components/PaySidebar.tsx`) is desktop-only (`lg` and up). On `lg` it is sticky to the viewport (`top-0`, `h-svh`) so it does not scroll with the main column; if the nav is taller than the viewport it scrolls inside the aside. It shows `/logo.svg` (links to `/`), the organization name (`user.organization.name`), the sidebar variant of `HeaderAccountMenu` (email trigger; Reset Password / Logout), a horizontal rule under the account, then the nav tree from `payNavItemsForRole` via shared `PayNav`. Active items use a white pill and `#06f` text. Operations is a collapsible group (Payroll, Expense, Bonus) for admin. The same `PayNav` renders inside the mobile top Drawer.

## Auth

Files: `src/views/auth/`. Guards: `src/router/guards.tsx`. Session: `src/stores/auth.ts` + `src/lib/auth-session.ts`. API: [api.md](api.md).

Auth screens share `AuthShell`: a blue brand panel (logo, headline, three feature titles with 32px icons, link to `/howitworks`) beside a light-gray form column. There is no white card on the right; forms sit on `#F6F6F6`. The layout stacks vertically below `md`. `AuthBetaBanner` sits above the login and register forms (`Pay. Stableflow is currently in beta.`). Google sign-in is not implemented.

| Screen | Fields | Endpoint |
| --- | --- | --- |
| `/login` | Email, password | `POST /v1/payroll/auth/login` |
| `/register` | Step 1: name, email, password, confirm password, invite code. Step 2: organization name (required, ≤ 50), logo URL (optional; if set, http(s) URL ≤ 500). Back returns to step 1 without clearing either step. | `POST /v1/payroll/auth/register` on step 2 (`organization` in the body). A failed request returns to step 1 and keeps step-2 input. |
| `/invite/:orgId` | Step 1: email, password, confirm password. Step 2 Profile Setting: name, position, plus Integration-enabled fields. Back returns to step 1 without clearing either step. | `GET /v1/payroll/organizations/info/{org_id}` then `POST /v1/payroll/auth/register/user` |

`/register` is admin-only. Invite code stays required. Members with role `user` join through `/invite/:orgId`, not `/register`.

Validation lives in `src/views/auth/config.ts` as pure `*RuleError` / `*FormError` functions (name ≤ 50, email ≤ 100 and pattern-checked, password 8–50, invite code ≤ 10, confirm must match, organization name ≤ 50, optional logo URL ≤ 500). The first failing rule is shown as an error toast; the request is not sent.

**Register organization.** `/register` is two local steps and one API call. Step 1 collects the account. Step 2 collects the organization, with a Back control that returns to step 1 without clearing either form. Continue on step 2 calls `POST /v1/payroll/auth/register` with `organization`. The session is not written until that call succeeds, so `RedirectIfAuthed` does not kick the visitor out mid-flow. If the request fails, the page returns to step 1 and keeps the organization fields. A successful register always includes an organization; there is no `/register/organization` route.

**Employee invite.** `/invite/:orgId` is a public page. `orgId` is the string `org_id` from `GET /v1/payroll/organizations/{id}`, not the integer id or the organization name. The page loads `GET /v1/payroll/organizations/info/{org_id}` (`auth: false`) and does not render the sign-up form until that call succeeds. Sign up is two local steps; the session is not written until Continue on step 2, so `RedirectIfAuthed` does not kick the visitor out mid-flow.

1. **Sign up.** Email, password, confirm password. Name is not collected here. The header shows the organization name and logo from info.
2. **Profile Setting.** Organization name, logo, and the step-1 email at the top. Back returns to step 1 without clearing either form. Fields follow Integration from the info response (EVM is `required` from the backend). Email / Telegram / Slack / SOLANA / NEAR / Tron appear only when that channel is on; Required channels must be filled. The account email from step 1 is reused when the Email channel is on — it is not asked again. Continue calls `POST /v1/payroll/auth/register/user` with string `org_id` and omits empty optional fields, then goes to `/`.

"Already have an account. Login" on step 1 goes to `/login` and does not auto-join the organization. Signed-in visitors are sent away by `RedirectIfAuthed`.

**Reset password** is `ResetPasswordDialog`, opened from "Forgot Password?" on `/login` (`guest` variant) and from the account menu (`authed` variant).

- `guest`: email → `POST /v1/payroll/reset-password/code` (60-second resend cooldown) → email + code + new password → `POST /v1/payroll/reset-password`.
- `authed`: current password + new password → `POST /v1/payroll/change-password`.

**Session.** `useLoginMutation` / `useRegisterMutation` / `useInviteRegisterMutation` call `applySession(token, user)`, which writes `stableflow-pay.session` to `localStorage` and updates `useAuthStore`. `useAuthStore` re-reads that key on first import, so a reload restores the session synchronously. `SessionBootstrap` in `src/App.tsx` runs `useProfileQuery()` to validate the token against `GET /v1/payroll/profile` in the background and refresh the cached user. Tokens that start with `mock:` skip the profile query so remaining mock domains are not logged out by a 401. `POST /v1/payroll/profile` (`useUpdateProfileMutation`) changes the display name from Settings → Profile. `AuthUser.role` is `"admin"` or `"user"`. Only `"user"` is the member role; any other stored value hydrates as admin. Login, register, profile, and invite-register map `organization` as `{ id, name, logo?, orgId? }` and optional `telegram` / `slack`. `GET /organizations/{id}` writes string `orgId` onto the session when it is missing. `hasOrganization` is true only when that name is non-empty after trim.

**Redirects.** `RequireAuth` sends anonymous visitors to `/login?returnTo=<path+search>`. `RedirectIfAuthed` sends signed-in visitors away from `/login`, `/register`, and `/invite/:orgId` through `postAuthPath` (`returnTo` or `/`). After a successful login or register the view uses the same helper. `safeReturnTo` in `return-to.ts` rejects anything that is not a same-origin absolute path and refuses to bounce back to `/login`, `/register`, `/register/organization`, or `/invite`. Users with role `user` who open `/pay/form`, `/pay/batch`, `/pay/payroll`, `/pay/expense`, `/pay/reimbursement`, `/pay/bonus`, or `/pay/team` are sent to `/`. Admins who open `/pay/request` or `/pay/requests` are sent to `/`.

**401.** Any authenticated request that returns 401 clears the stored session and calls `notifyUnauthorized()`, which `src/stores/auth.ts` has wired to `logout()` (clears the store and the whole TanStack Query cache). The next render hits `RequireAuth` and lands on `/login`.

## Pay

Files: `src/views/pay/`. Constants: `src/views/pay/config.ts`. Sidebar: `PaySidebar` reads `payNavItemsForRole(user.role)`.

**Admin** sidebar: Overview (`/`), Payment (`/pay` and `/pay/form`), Operations (Payroll dashboard at `/pay/payroll`, create flow still at `/pay/batch`; Expense dashboard at `/pay/expense`; Bonus dashboard at `/pay/bonus`), Team (`/pay/team`), History (`/pay/history`), Settings (`/pay/setting`). Pending Payouts is not in the sidebar; `/pay/pending` remains reachable by URL. Request Payment is employee-only.

**Employee** sidebar: Overview (`/`), Payment (`/pay` only, no mode tabs), Request Payment (`/pay/request` and `/pay/requests`), History, Settings. No Operations or Team.

Shared building blocks: `TokenSelectDialog` (chain + token picker, optional balances), `PayoutsTable` (Recipient / Amount / Asset / Memo / Time / Status with an explorer link), `RecipientAddressField` + `RecipientsDialog` + `ContactFormDialog` (address book), `PaymentByFormCard` + `PaymentByFormDialog` (Payment by form, including locked-form Pay Now), `PaymentFormDetailsDrawer` (Total Valued details), `SinglePayoutCard` + `SinglePayoutDialog` (Single Payment, including locked-recipient Pay Now), `usePayOriginToken` and `usePaymentWallet` (paying token and matching wallet).

Amounts are limited to `AMOUNT_MAX_DECIMALS` (6) in the inputs, memos to `MEMO_MAX_LENGTH` (200), and slippage is fixed at `QUICK_PAY_SLIPPAGE_TOLERANCE` (5).

### Pay Now dialogs

Reusable Pay Now overlays. Mount them from the page; do not wrap them in another Dialog.

**Which dialog**

- Single payment with a prefilled recipient → `SinglePayoutDialog` (same folder as `SinglePayoutCard`).
- Batch / Payment by form with a locked Form → `PaymentByFormDialog` (same folder as `PaymentByFormCard`).

**`SinglePayoutDialog`**

Import: `@/views/pay/components/single-payout/SinglePayoutDialog`.

Props: `open`, `onClose`, `recipient: { name: string; wallets } | null`.

Renders `SinglePayoutCard` whenever `recipient` is set (wallets may all be empty). The address field is editable. Current caller: `/pay/team`. Initial address prefers evm → near → solana → tron. Changing the recipient token fills that chain's wallet, or leaves the address empty so the payer can paste one.

```tsx
<SinglePayoutDialog
  open={Boolean(paying)}
  recipient={paying ? { name: paying.name, wallets: paying.wallets } : null}
  onClose={() => setPaying(null)}
/>
```

**`PaymentByFormDialog`**

Import: `@/views/pay/components/payment-form/PaymentByFormDialog`.

Props: `open`, `onClose`, `formId: string | null`.

Renders `PaymentByFormCard` with `formId` + `formLocked` (Form dropdown disabled; details still load by id). Closes on successful send (`onSettled`). Current callers: `/pay/payroll`, `/pay/expense`, `/pay/bonus`.

```tsx
<PaymentByFormDialog
  open={Boolean(payingFormId)}
  formId={payingFormId}
  onClose={() => setPayingFormId(null)}
/>
```

### `/` — Overview

Title **Overview**. `OverviewView` reads `AuthUser.role`. Admin loads `GET /v1/payroll/organizations/overview` (`organization_id` from session `user.organization.id`): organization summary (session `organization.name` / `organization.logo`, owner, `team_members` linking to `/pay/team`, Update Settings linking to `/pay/setting`), a Payments card (`total_payout` / `total_payments` as Total Payment / Number of Payments with View all to `/pay/history`; area chart from `GET /v1/payroll/organizations/payout` with Daily / Weekly / Monthly and the browser timezone; Volume vs Transaction; Transaction uses `#84A20F`; hover tooltip shows both series; an empty series still draws a zero grid), and High Priority from `GET /v1/payroll/organizations/high-priority` (`payroll` → `/pay/payroll`, `paymentRequest` → `/pay/expense`, `payFailed` → `/pay/history`; the header View All control is commented out). Overview loading or failure blocks the page; payout and high-priority queries do not. Role `user` sees a mock dashboard (`employeeOverview` in [mocks.md](mocks.md)): greeting, Total Income / Payment Transaction and Total Payout / Payout Transaction cards, a grouped Payment Volume bar chart (Income green, Payout purple; Daily / Weekly / Monthly; grid stays visible when a period has no values), Open Requests (link to `/pay/requests`), and Recent Payments (link to `/pay/history`). `/pay/overview` redirects here.

### `/pay` — Single Payment

Title **Payment**. For **admin**, a centred `PaymentModeTabs` control switches Single Payment (`/pay`) and Payment by form (`/pay/form`). Employees do not see the tabs. One card: recipient (search / paste address, address book), amount plus recipient token, and purpose. Changing the address to another chain clears the selected token; a default USDT → USDC → first-available token for that chain is then picked by `defaultDestToken`. The empty submit label is **Starts from adding recipient**; once the form can send it becomes **Send Payment**. There is no Notify Recipient control.

The form lives in `SinglePayoutCard` so `SinglePayoutDialog` can mount the same card with a prefilled recipient. The address book (`RecipientsDialog`) depends on role: **admin** lists Team members with a wallet (`useTeamMembersInfiniteQuery`, scroll to load more, display wallet evm → near → solana → tron) and is select-only (no Add / Edit / Delete; Team is managed on `/pay/team`). Pasting any of a member's wallets still matches the name chip. **Employee** keeps a personal book: create, edit, and delete through `useContacts` → `/v1/payroll/recipients`.

**Send Payment** posts to `/v1/payroll/payments` (`useCreatePayrollPaymentMutation`) with the amount, the recipient, the destination `network` / `symbol` from `payoutNetworkToken`, the optional purpose (`memo` on the API), and `success_url` = `{origin}/pay/result`. The backend creates a hosted checkout session and answers with `pay_url`; the browser is sent there with `window.location.assign`. Payment itself happens on the hosted checkout, so this screen never touches a wallet.

There is no notify-recipient field: the endpoint has no `notifyEmail` parameter.

### `/pay/form` — Payment by form

Title **Payment**. Same `PaymentModeTabs` as Single Payment. The page wraps `PaymentByFormCard` in a 600px card. `PaymentByFormDialog` mounts the same card with `formId` + `formLocked` (Form dropdown disabled; details still load by id).

The Form dropdown lists saved batch payouts (Payroll / Reimbursement / Bonus, name, USD total). List and detail are mock data (`paymentForms` in [mocks.md](mocks.md)) until that contract exists. Picking a row loads its payment rows, then the payer chooses the You Pay wallet, chain, and token (`YouPaySection` with `BATCH_BLOCKCHAINS`). That posts `POST /v1/payroll/batches` (`useCreatePayrollBatchQuery`) and fills You Pay / Est. Cost from `totalSourceAmount`. **Send Payment** signs and broadcasts like Payroll (`broadcastBatchPayout`). Empty CTA is **Select Category**.

There is no Notify Recipients control. After a form is selected, Total Valued shows a Details control that opens a drawer (right side from `768px` up, bottom sheet below). The drawer lists Total Value, recipient count, optional next pay-date, and each recipient (name, email, address, payout preference, amount, net pay). Edit in the header is visible and does nothing yet.

### `/pay/result` — Payment Result

Where the hosted checkout returns after a **successful** payment; it is not in the sidebar, and `PAY_ROUTE_TITLES` supplies its layout title. The checkout appends `amount`, `network`, `expires_at`, `created_at`, `out_order_no`, `recipient`, `session_id`, `status`, `symbol`, `destination_txHash`, `paid_at`, and `tx_hash` to the URL; `parsePayoutCallbackParams` reads them.

`out_order_no` carries the Payroll `payment_id`, which the page passes to `GET /v1/payroll/payments/{payment_id}` (`usePayrollPaymentQuery`, read once — the checkout only returns on success, so there is nothing to poll). Until that resolves, and if it fails or `out_order_no` is missing, the page renders from the callback query alone; the memo and the paying-side amount only appear once the lookup succeeds.

The pre-checkout quote / swap / broadcast path (`useSinglePayQuote`, `useSinglePaySwap`, `transferToDepositAddress`, `enqueueQuickPayCommit`) is no longer used by this screen. `RequestPayView` still calls it. Do not delete it.

### `/pay/payroll` — Payroll

Files: `src/views/payroll/`. API: [api.md](api.md) salaries endpoints.

Dashboard for the Operations → Payroll nav item. Stats (`GET /v1/payroll/salaries/current`), a six-month total-payroll chart (`GET /v1/payroll/salaries/total-payout`), recent payouts with scroll-to-load (`GET /v1/payroll/salaries/recent`), Next Payroll (`GET /v1/payroll/salaries/next`), and Payroll History (`GET /v1/payroll/salaries/history`, paginated). Next Payroll rows show email after address. **View Details** on a history card opens a right-side drawer (Figma `2766:18971`) with `GET /v1/payroll/salaries/history/{execution_id}`. Each live block has its own loading state. An empty or failed next-payroll request shows the create-payroll CTA (Download Template, Import CSV, Add Payroll). **Add Payroll** / **Add a new Payroll** and **Edit** open a right-side drawer (`Add Payroll` / `Edit Payroll`) instead of `/pay/batch`. Set Pay Date offers First day of month, Last day of month, and Day of month. Day of month opens a 1–31 picker; choosing 1 or 31 still saves as `first_day` / `last_day`. **Import CSV** (Choose file or Google Docs) parses on this page and opens the Add Payroll drawer with the rows; **Save** posts `POST /v1/payroll/salaries/import` and stays on `/pay/payroll`. Edit drawer **Save** posts `POST /v1/payroll/salaries/update` (existing row ids, new rows without id, removed ids in `delete_ids`) and stays on `/pay/payroll`. Payroll History **Export CSV** calls `GET /v1/payroll/salaries/history/export` (`organization_id`, `timezone`) and is hidden on Next Payroll. **Pay Now** opens `PaymentByFormDialog` with `PAYROLL_PAY_NOW_FORM_ID` (`form-september-payroll`).

### `/pay/expense` — Expense

Files: `src/views/expense/`. API: [api.md](api.md) expenses endpoints.

Dashboard for the Operations → Expense nav item. Stats (`GET /v1/payroll/expenses/current`), a six-month total-expense chart (`GET /v1/payroll/expenses/total-payout`), recent payouts with scroll-to-load (`GET /v1/payroll/expenses/recent`), and Open expense (`GET /v1/payroll/expenses/open`) / Request Payments (`GET /v1/payroll/expenses/open/requests`, badge from `GET /v1/payroll/expenses/open/requests/count`) / Expense History (`GET /v1/payroll/expenses/history`, paginated) tabs. Each live block has its own loading state. An empty open-expense list shows the create-expense CTA (Download Template, Import CSV, Add Expense) and hides the tab toolbar. Request Payments hides the toolbar; an empty list shows "No payment requests". When Open expense has rows, or on Expense History, the tab toolbar shows **Import CSV** and **Add Expense**. **Import CSV** (Choose file or Google Docs) parses locally and opens the **Add Expense** drawer with the rows; **Add Expense** opens the same drawer empty. **Save** posts `POST /v1/payroll/expenses/import` (`title` plus items), then returns to the Open expense tab. History search and the date range are sent as `search` / `start_time` / `end_time`. **Export CSV** downloads the loaded history rows (there is no export route). **Pay Now** on an open or request row (not Paying) opens `PaymentByFormDialog` with `EXPENSE_PAY_NOW_FORM_ID` (`form-open-reimbursement`).

### `/pay/bonus` — Bonus

Files: `src/views/bonus/`. Mock: `src/mocks/bonus.ts`.

Dashboard for the Operations → Bonus nav item. Stats (Total Bonus with token label, Members), a six-month total-bonus chart, recent payouts, and Bonuses to be paid / Bonus History tabs. Data is mocked until the backend contract exists. A header **Sample data** switch toggles the empty create-bonus CTA vs filled pending bonuses (individual + expandable group rows with Pay Now / Paying) and Bonus History (Figma `2672:7309`). **Add Bonus** opens a right-side drawer. Import CSV still goes to `/pay/batch`. **Pay Now** opens `PaymentByFormDialog` with `BONUS_PAY_NOW_FORM_ID` (`bonus-team-a` → `form-2026-bonus-team-a`, `bonus-team-b` → `form-2026-bonus-team-b`). Paying rows stay disabled.

### `/pay/batch` — Create Payroll (Batch Payout)

Three page steps (`upload` → `validate` → `preview`) with a two-dot `BatchStepper` injected into the layout header.

1. **Upload.** Drop a CSV, pick a Google Sheet through the Picker, or start with one empty row. Template and accepted extensions are in `config.ts` (`IMPORT_CSV_TEMPLATE`, `IMPORT_CSV_ACCEPT`); columns are `recipient,email,amount,token,network,memo`. Email is optional. Imports are capped at `IMPORT_MAX_ROWS` (50) and the extra rows are dropped with a toast.
2. **Validate.** An editable table of drafts with per-field status. `batch-utils.ts` owns parsing, patching, per-row validation, token resolution against the 1Click token list, totals, and the per-token breakdown. The paying token is chosen here; its balance is polled every `ORIGIN_BALANCE_POLL_MS` (20s).
3. **Preview.** Totals, payout count, fee and cost from `POST /v1/payroll/batches` (`useCreatePayrollBatchQuery`, posted once when this step opens). A refresh control on the card (and an expired or already-used quote) posts again. Confirm stays disabled while the quote is stale, errored, or consumed. Confirm re-reads the wallet balance, refuses to continue when it is short of `totalSourceAmountRaw`, marks the `batchId` consumed, broadcasts through `broadcastBatchPayout`, then resets the flow. There is no submit after broadcast and no waiting page.

The paying chain is restricted to `BATCH_BLOCKCHAINS` from `src/config/chains.ts`.

### `/pay/pending` — Pending Payouts

Read-only `PayoutsTable` over `GET /v1/payroll/payments/pending`. Every row renders as Pending. The query polls every 8 seconds while the list is non-empty and stops when it drains. The page is not in the sidebar; it is reachable at `/pay/pending`.

### `/pay/history` — Transaction History

Mock data (`history` in [mocks.md](mocks.md)) until that contract exists. Top bar: Search, `DateRangePicker` (last 30 days), Export CSV of the current filter result. Card toolbar (same grid as v3 Reports Transactions): Source Network, Source Token, Destination Network, Destination Token, Amount (`All` / `0-1,000` / `1,000-10,000` / `>10,000`), Status (`All` / `Success` / `Failed`). Network options are `FIXED_CHAINS` plus All; token options are `PAYOUT_SYMBOLS` plus All. Every filter change resets to page 1. The table has no Status column.

Columns: Amount, Source, arrow, Received, Destination, From, To, Time. Source / Destination show token logo and `SYMBOL · Chain`. From / To truncate the address, copy it, and open the tx explorer (`txHash` on the source chain, `destinationTxHash` on the destination). Pagination sits in the card footer. Export does not call `/payments/export`.

### `/pay/request` and `/pay/requests` — Request Payment

Employee-only. Header tabs replace the layout title: **Request Payment** (`/pay/request`) and **Requests** (`/pay/requests`). Admins who open either path are sent to `/`. Overview Open Requests "View All" goes to `/pay/requests`.

The form is Purpose (required, `name` on the API; help tooltip explains it is the short name the payer sees), optional Description (`memo`), Payment setting (amount + token via `TokenSelectDialog`), and Receiving Address (auto-filled from the connected wallet for the selected token's chain). **Save as default** is visible only; it does not persist or call an API yet. There is no private / Receive Privately mode.

**Generate Payment Request** posts `POST /v1/payroll/request` with `mode: standard`. On success a dialog shows the generated `{origin}/p/{id}` URL. **Copy Link** copies it. **Preview** is visible and does nothing; opening the public payer (`/p/:id`) is out of scope while that route stays commented out.

`/pay/requests` lists the employee's requests from `GET /v1/payroll/request/list`. Columns: Purpose (name, copy-link control, created time), Request Payment (`amount SYMBOL · Chain`), Receive Address, Paid Address, Paid Time, Status. Status is Pending (`pending` / `submitted`, `#3f8afb`), Complete (`completed`, `#84a20f`, explorer link on `destination_tx_hash`), or Failed. There is no withdraw, disable, or refresh switch.

### `/pay/team` — Team

Search, paginated member table (Name, Position, Email, Wallet), Add Member, and Invite. List CRUD uses `/v1/payroll/team/members`. Search `q` is debounced 300ms (name, email, position, evm address). Page size is 10. Wallet prefers evm, then near, then Solana, then Tron.

Add Member (white dashed border + plus) and Invite (black + link icon) share `TeamActionButtons` with Settings → Organization.

**Add / Edit** is a dialog driven by Settings Integration from `GET /v1/payroll/organizations/{id}`: Name is always shown. Position is optional. Wallet and notification fields render only when that channel is on; Required channels must be filled (EVM is required by the backend). Name and Position ≤ 50. A filled wallet must match that chain (`validateAddress`, including Tron). Save stays disabled while a required field is empty or a filled field is invalid. Telegram and Slack are validated in the form but are not sent to the API.

**Invite** shows `{origin}/invite/{org_id}` (string `org_id`, URL-encoded) with Copy. It does not add a row. Invite is unavailable until that string id is loaded.

Row menu: Edit, Pay Now, Remove. Remove asks for confirmation. **Pay Now** always opens `SinglePayoutDialog` with the member's name and wallets. The address field is editable. The first filled wallet is prefilled (evm → near → solana → tron); changing the recipient token switches to that chain's wallet, or leaves the field empty so the payer can type or paste one.

### `/pay/setting` — Settings

`SettingView`. Employee sees Profile only. Admin sees Profile, Organization, and Integration.

**Profile.** Name is editable; Account Email is read-only. Reset Password opens the authed `ResetPasswordDialog`. Save (bottom right) calls `POST /v1/payroll/profile` and updates the session name.

**Organization (admin).** `GET /v1/payroll/organizations/{id}` hydrates Organization Name, optional Logo URL, Integration settings, and string `org_id` (the item matching `id`, or the first row). Same name/logo validation as register organization. Add Member / Invite use the same buttons and dialogs as Team. Save (bottom right) posts `POST /v1/payroll/organizations/{id}` with the current name/logo plus the **saved** Integration settings (`useUpdateOrganizationMutation`) and writes `organization.name` / `logo` onto the session.

**Integration (admin).** Channel of notification: Email, Telegram, Slack. Wallet Address: EVM (locked Required, no switch; the backend keeps `evm_address` required), SOLANA, NEAR, Tron. Each unlocked card has a Switch and a Required / Optional dropdown (disabled when the switch is off). Changes stay in a local draft until Save, which POSTs the full organization payload (saved name/logo plus draft settings; EVM status is not changed). Telegram / Slack logos live in `public/setting/`. Email uses `IconEmail`. These settings drive Add Member and Invite Profile Setting.

## Wallet and payout capability

`src/config/chains.ts` is the chain registry: 1Click blockchain code, display name, chain kind, EVM chain id, logo, explorer prefix, and `payerEnabled` / `batchEnabled` flags. It also maps CSV/Sheets aliases (`ethereum` → `eth`, `matic` → `pol`, and so on) so imported rows resolve.

`src/wallet/` holds one adapter per chain kind (`evm/`, `near/`, `solana/`, `tron/`) plus the shared `WalletProvider`, `transfer-deposit.ts`, `broadcast-quick-pay.ts`, and `broadcast-batch-payout.ts`. Features talk to wallets through `useWallet`, `useConnectedWallets`, and `usePaymentWallet` rather than importing an adapter directly.
