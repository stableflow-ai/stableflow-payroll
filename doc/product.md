# Product Map

Stableflow Pay lets a signed-in business send stablecoin payouts across EVM, Near, Solana, and Tron from a single paying wallet. Cross-chain routing goes through Near Intents (1Click) behind the backend.

The backend is the **Payroll** API: every route in `src/api/` is built from `PAY_API_PREFIX`, which is `/v1/payroll`. Auth, Single Payout, and Batch Payout have Payroll endpoints today; the other Pay screens still call paths under that prefix that the backend does not serve yet.

Only two areas are released: **Auth** and **Pay**. Everything else is either a public side page or a route that is commented out in `src/router/index.tsx`. This document details the released areas only.

## Areas

| Area | Routes | Status | Notes |
| --- | --- | --- | --- |
| Auth | `/login`, `/register`, `/register/organization`, `/invite/:orgId` | Released | Detailed below. Reset password is a dialog, not a route. |
| Pay | `/`, `/pay`, `/pay/form`, `/pay/result`, `/pay/payroll`, `/pay/batch`, `/pay/expense`, `/pay/bonus`, `/pay/team`, `/pay/history`, `/pay/setting`, `/pay/pending`, `/pay/request` | Released | Detailed below. Requires a session. Overview is `/` (`/pay/overview` redirects there). `/pay/reimbursement` redirects to `/pay/expense`. |
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

`PayLayout` (`src/layouts/PayLayout.tsx`) is the authenticated Pay chrome: a 220px left sidebar (`PaySidebar`) with a right divider, a content header (page title from `payTitleForPath`, optional `setHeaderExtra`, and `HeaderWalletCapsule` on the right) with a full-width bottom border, and `PaymentModeTabs` on `/pay` and `/pay/form` for **admin** only (below the header rule). It also mounts `useQuickPayCommitQueue()` and `useBatchPayoutCommitQueue()`, which drain the persisted submit queues in the background. Below `lg` the sidebar is hidden. A compact top row shows the logo (links to `/`), the organization name (`user.organization.name` when present, otherwise `MOCK_ORGANIZATION_NAME`) stacked above the account menu (avatar, name, dropdown), and a menu button on the right that opens a top Drawer with the role-filtered nav. The wallet capsule is desktop-only.

`PaySidebar` (`src/views/pay/components/PaySidebar.tsx`) is desktop-only (`lg` and up). On `lg` it is sticky to the viewport (`top-0`, `h-svh`) so it does not scroll with the main column; if the nav is taller than the viewport it scrolls inside the aside. It shows `/logo.svg` (links to `/`), the organization name (`user.organization.name` when present, otherwise `MOCK_ORGANIZATION_NAME` = Eureka Labs), the sidebar variant of `HeaderAccountMenu` (email trigger; Reset Password / Logout), a horizontal rule under the account, then the nav tree from `payNavItemsForRole` via shared `PayNav`. Active items use a white pill and `#06f` text. Operations is a collapsible group (Payroll, Expense, Bonus) for admin. The same `PayNav` renders inside the mobile top Drawer.

## Auth

Files: `src/views/auth/`. Guards: `src/router/guards.tsx`. Session: `src/stores/auth.ts` + `src/lib/auth-session.ts`. API: [api.md](api.md).

Auth screens share `AuthShell`: a blue brand panel (logo, headline, three feature titles with 32px icons, link to `/howitworks`) beside a light-gray form column. There is no white card on the right; forms sit on `#F6F6F6`. The layout stacks vertically below `md`. `AuthBetaBanner` sits above the login and register forms (`Pay. Stableflow is currently in beta.`). Google sign-in is not implemented.

| Screen | Fields | Endpoint |
| --- | --- | --- |
| `/login` | Email, password | `POST /v1/payroll/auth/login` |
| `/register` | Name, email, password, confirm password, invite code | `POST /v1/payroll/auth/register` |
| `/register/organization` | Organization name (required, ≤ 50), logo URL (optional; if set, http(s) URL ≤ 200) | Mock until the create-organization contract exists |
| `/invite/:orgId` | Step 1: email, password, confirm password. Step 2 Profile Setting: name, position, EVM, plus Integration-enabled fields | Mock invite preview + register-and-bind until that contract exists |

`/register` is admin-only. Invite code stays required. Employees join through `/invite/:orgId`, not `/register`.

Validation lives in `src/views/auth/config.ts` as pure `*RuleError` / `*FormError` functions (name ≤ 50, email ≤ 100 and pattern-checked, password 8–50, invite code ≤ 10, confirm must match, organization name ≤ 50, optional logo URL). The first failing rule is shown as an error toast; the request is not sent.

**Create organization.** After login or register, `postAuthPath` sends an admin whose `organization.name` is missing to `/register/organization`. That page is authenticated (`RedirectIfHasOrganization`): guests go to `/login`, employees and admins who already have an organization go to `/`. The top-right chip shows the current email and a logout control (hover `text-danger`) so the user can switch accounts before creating an organization. Create organization is mocked (`organization` in [mocks.md](mocks.md)); on success the session user is updated with `organization.name` and the app continues to `returnTo` or `/`. `RequireOrganization` wraps Pay routes so an admin without an organization cannot enter the homepage.

**Employee invite.** `/invite/:orgId` is a public page. It loads a mock preview (inviter email, avatar, organization name, and the current Integration settings). Sign up is two local steps; the session is not written until Continue on step 2, so `RedirectIfAuthed` does not kick the visitor out mid-flow.

1. **Sign up.** Email, password, confirm password. Name is not collected here.
2. **Profile Setting.** Organization name, avatar, and the step-1 email at the top. Fixed fields: Name, Position (optional), EVM Wallet Address (required). Email / Telegram / Slack / SOLANA / NEAR / Tron appear only when that Integration channel is on; Required channels must be filled. The account email from step 1 is reused when the Email channel is on — it is not asked again. Continue calls `registerWithInvite`, then goes to `/`.

"Already have an account. Login" on step 1 goes to `/login` and does not auto-join the organization. Signed-in visitors are sent away by `RedirectIfAuthed`.

**Reset password** is `ResetPasswordDialog`, opened from "Forgot Password?" on `/login` (`guest` variant) and from the account menu (`authed` variant).

- `guest`: email → `POST /v1/payroll/reset-password/code` (60-second resend cooldown) → email + code + new password → `POST /v1/payroll/reset-password`.
- `authed`: current password + new password → `POST /v1/payroll/change-password`.

**Session.** `useLoginMutation` / `useRegisterMutation` call `applySession(token, user)`, which writes `stableflow-pay.session` to `localStorage` and updates `useAuthStore`. `useAuthStore` re-reads that key on first import, so a reload restores the session synchronously. `SessionBootstrap` in `src/App.tsx` runs `useProfileQuery()` to validate the token against `GET /v1/payroll/profile` in the background and refresh the cached user. Tokens that start with `mock:` skip the profile query so invite-register mocks are not logged out by a 401. `POST /v1/payroll/profile` (`useUpdateProfileMutation`) changes the display name from Settings → Profile. `AuthUser.role` is `"admin"` or `"employee"` and is assumed to already be on the login / profile payload. Stored sessions that predate `role` hydrate as admin. Login, register, and profile are assumed to return optional `organization.name`; `hasOrganization` is true only when that name is non-empty after trim.

**Redirects.** `RequireAuth` sends anonymous visitors to `/login?returnTo=<path+search>`. `RedirectIfAuthed` sends signed-in visitors away from `/login`, `/register`, and `/invite/:orgId` through `postAuthPath` (admin without an organization → `/register/organization`, otherwise `returnTo` or `/`). After a successful login or register the view uses the same helper. `safeReturnTo` in `return-to.ts` rejects anything that is not a same-origin absolute path and refuses to bounce back to `/login`, `/register`, `/register/organization`, or `/invite`. Employees who open `/pay/form`, `/pay/batch`, `/pay/payroll`, `/pay/expense`, `/pay/reimbursement`, `/pay/bonus`, or `/pay/team` are sent to `/`.

**401.** Any authenticated request that returns 401 clears the stored session and calls `notifyUnauthorized()`, which `src/stores/auth.ts` has wired to `logout()` (clears the store and the whole TanStack Query cache). The next render hits `RequireAuth` and lands on `/login`.

## Pay

Files: `src/views/pay/`. Constants: `src/views/pay/config.ts`. Sidebar: `PaySidebar` reads `payNavItemsForRole(user.role)`.

**Admin** sidebar: Overview (`/`), Payment (`/pay` and `/pay/form`), Operations (Payroll dashboard at `/pay/payroll`, create flow still at `/pay/batch`; Expense dashboard at `/pay/expense`; Bonus dashboard at `/pay/bonus`), Team (`/pay/team`), History (`/pay/history`), Settings (`/pay/setting`). Pending Payouts is not in the sidebar; `/pay/pending` remains reachable by URL. Request Payment is URL-only for admin.

**Employee** sidebar: Overview (`/`), Payment (`/pay` only, no mode tabs), Request Payment (`/pay/request`), History, Settings. No Operations or Team.

Shared building blocks: `TokenSelectDialog` (chain + token picker, optional balances), `PayoutsTable` (Recipient / Amount / Asset / Memo / Time / Status with an explorer link), `RecipientAddressField` + `RecipientsDialog` + `ContactFormDialog` (address book), `PaymentByFormCard` (reusable Payment by form card), `PaymentFormDetailsDrawer` (Total Valued details), `SinglePayoutCard` (reusable Single Payment card, including Team Pay Now), `usePayOriginToken` and `usePaymentWallet` (paying token and matching wallet).

Amounts are limited to `AMOUNT_MAX_DECIMALS` (6) in the inputs, memos to `MEMO_MAX_LENGTH` (200), and slippage is fixed at `QUICK_PAY_SLIPPAGE_TOLERANCE` (5).

### `/` — Overview

Title **Overview**. `OverviewView` reads `AuthUser.role`. Admin sees a mock dashboard (`adminOverview` in [mocks.md](mocks.md)): organization summary (owner, team count linking to `/pay/team`, Update Settings linking to `/pay/setting`), a Payments card (Total Payment / Total Transactions / Payroll Recipient, area chart with Volume vs Transaction and Daily / Weekly / Monthly; Transaction uses `#84A20F`; hover tooltip shows both series), and High Priority (payroll, expense requests, failed history). Employee sees a mock dashboard (`employeeOverview` in [mocks.md](mocks.md)): greeting, Total Income / Payment Transaction and Total Payout / Payout Transaction cards, a grouped Payment Volume bar chart (Income green, Payout purple; Daily / Weekly / Monthly; grid stays visible when a period has no values), Open Requests (link to `/pay/request`), and Recent Payments (link to `/pay/history`). `/pay/overview` redirects here.

### `/pay` — Single Payment

Title **Payment**. For **admin**, a centred `PaymentModeTabs` control switches Single Payment (`/pay`) and Payment by form (`/pay/form`). Employees do not see the tabs. One card: recipient (search / paste address, address book), amount plus recipient token, and purpose. Changing the address to another chain clears the selected token; a default USDT → USDC → first-available token for that chain is then picked by `defaultDestToken`. The empty submit label is **Starts from adding recipient**; once the form can send it becomes **Send Payment**. There is no Notify Recipient control.

The form lives in `SinglePayoutCard` so Team Pay Now can mount the same card in a dialog with a locked recipient. The address book dialogs create, edit, and delete recipients through `useContacts` → `/v1/payroll/recipient*`.

**Send Payment** posts to `/v1/payroll/payments` (`useCreatePayrollPaymentMutation`) with the amount, the recipient, the destination `network` / `symbol` from `payoutNetworkToken`, the optional purpose (`memo` on the API), and `success_url` = `{origin}/pay/result`. The backend creates a hosted checkout session and answers with `pay_url`; the browser is sent there with `window.location.assign`. Payment itself happens on the hosted checkout, so this screen never touches a wallet.

There is no notify-recipient field: the endpoint has no `notifyEmail` parameter.

### `/pay/form` — Payment by form

Title **Payment**. Same `PaymentModeTabs` as Single Payment. The page wraps `PaymentByFormCard` in a 600px card so a later dialog can mount the same card with `formId` + `formLocked` (Form dropdown disabled; details still load by id).

The Form dropdown lists saved batch payouts (Payroll / Reimbursement / Bonus, name, USD total). List and detail are mock data (`paymentForms` in [mocks.md](mocks.md)) until that contract exists. Picking a row loads its payment rows, then the payer chooses the You Pay wallet, chain, and token (`YouPaySection` with `BATCH_BLOCKCHAINS`). That posts `POST /v1/payroll/batches` (`useCreatePayrollBatchQuery`) and fills You Pay / Est. Cost from `totalSourceAmount`. **Send Payment** signs and broadcasts like Payroll (`broadcastBatchPayout`). Empty CTA is **Select Category**.

There is no Notify Recipients control. After a form is selected, Total Valued shows a Details control that opens a drawer (right side from `768px` up, bottom sheet below). The drawer lists Total Value, recipient count, optional next pay-date, and each recipient (name, email, address, payout preference, amount, net pay). Edit in the header is visible and does nothing yet.

### `/pay/result` — Payment Result

Where the hosted checkout returns after a **successful** payment; it is not in the sidebar, and `PAY_ROUTE_TITLES` supplies its layout title. The checkout appends `amount`, `network`, `expires_at`, `created_at`, `out_order_no`, `recipient`, `session_id`, `status`, `symbol`, `destination_txHash`, `paid_at`, and `tx_hash` to the URL; `parsePayoutCallbackParams` reads them.

`out_order_no` carries the Payroll `payment_id`, which the page passes to `GET /v1/payroll/payments/{payment_id}` (`usePayrollPaymentQuery`, read once — the checkout only returns on success, so there is nothing to poll). Until that resolves, and if it fails or `out_order_no` is missing, the page renders from the callback query alone; the memo and the paying-side amount only appear once the lookup succeeds.

The pre-checkout quote / swap / broadcast path (`useSinglePayQuote`, `useSinglePaySwap`, `transferToDepositAddress`, `enqueueQuickPayCommit`) is no longer used by this screen. `RequestPayView` still calls it. Do not delete it.

### `/pay/payroll` — Payroll

Files: `src/views/payroll/`. Mock: `src/mocks/payroll.ts`.

Dashboard for the Operations → Payroll nav item. Stats, a six-month total-payroll chart, recent payouts, and Next Payroll / Payroll History tabs. Data is mocked until the backend contract exists. A header **Sample data** switch toggles the empty create-payroll CTA (Download Template, Import CSV, Add Payroll) vs filled Next Payroll and Payroll History (pending / failed / paid run cards). **Add Payroll** / **Add a new Payroll** and **Edit** open a right-side drawer (`Add Payroll` / `Edit Payroll`) instead of `/pay/batch`. Import CSV and Pay Now still go to `/pay/batch`.

### `/pay/expense` — Expense

Files: `src/views/expense/`. Mock: `src/mocks/expense.ts`.

Dashboard for the Operations → Expense nav item. Stats, a six-month total-expense chart, recent payouts, and Open expense / Expense History tabs. History has a name/address/amount search, a last-30-days date filter, and client-side CSV export. Data is mocked until the backend contract exists. Pay Now does not submit yet.

### `/pay/bonus` — Bonus

Files: `src/views/bonus/`. Mock: `src/mocks/bonus.ts`.

Dashboard for the Operations → Bonus nav item. Stats (Total Bonus with token label, Members), a six-month total-bonus chart, recent payouts, and Bonuses to be paid / Bonus History tabs. Data is mocked until the backend contract exists. A header **Sample data** switch toggles the empty create-bonus CTA vs filled pending bonuses (individual + expandable group rows with Pay Now / Paying) and Bonus History (Figma `2672:7309`). **Add Bonus** opens a right-side drawer. Import CSV and Pay Now still go to `/pay/batch`.

### `/pay/batch` — Create Payroll (Batch Payout)

Three page steps (`upload` → `validate` → `preview`) with a two-dot `BatchStepper` injected into the layout header.

1. **Upload.** Drop a CSV, pick a Google Sheet through the Picker, or start with one empty row. Template and accepted extensions are in `config.ts` (`IMPORT_CSV_TEMPLATE`, `IMPORT_CSV_ACCEPT`); columns are `recipient,amount,token,network,memo`. Imports are capped at `IMPORT_MAX_ROWS` (50) and the extra rows are dropped with a toast.
2. **Validate.** An editable table of drafts with per-field status. `batch-utils.ts` owns parsing, patching, per-row validation, token resolution against the 1Click token list, totals, and the per-token breakdown. The paying token is chosen here; its balance is polled every `ORIGIN_BALANCE_POLL_MS` (20s).
3. **Preview.** Totals, payout count, fee and cost from `POST /v1/payroll/batches` (`useCreatePayrollBatchQuery`, posted once when this step opens). A refresh control on the card (and an expired or already-used quote) posts again. Confirm stays disabled while the quote is stale, errored, or consumed. Confirm re-reads the wallet balance, refuses to continue when it is short of `totalSourceAmountRaw`, marks the `batchId` consumed, broadcasts through `broadcastBatchPayout`, then resets the flow. There is no submit after broadcast and no waiting page.

The paying chain is restricted to `BATCH_BLOCKCHAINS` from `src/config/chains.ts`.

### `/pay/pending` — Pending Payouts

Read-only `PayoutsTable` over `GET /v1/payroll/payments/pending`. Every row renders as Pending. The query polls every 8 seconds while the list is non-empty and stops when it drains. The page is not in the sidebar; it is reachable at `/pay/pending`.

### `/pay/history` — Transaction History

Mock data (`history` in [mocks.md](mocks.md)) until that contract exists. Top bar: Search, `DateRangePicker` (last 30 days), Export CSV of the current filter result. Card toolbar (same grid as v3 Reports Transactions): Source Network, Source Token, Destination Network, Destination Token, Amount (`All` / `0-1,000` / `1,000-10,000` / `>10,000`), Status (`All` / `Success` / `Failed`). Network options are `FIXED_CHAINS` plus All; token options are `PAYOUT_SYMBOLS` plus All. Every filter change resets to page 1. The table has no Status column.

Columns: Amount, Source, arrow, Received, Destination, From, To, Time. Source / Destination show token logo and `SYMBOL · Chain`. From / To truncate the address, copy it, and open the tx explorer (`txHash` on the source chain, `destinationTxHash` on the destination). Pagination sits in the card footer. Export does not call `/payments/export`.

### `/pay/request` — Request Payment

Reachable by URL only; the sidebar entry is commented out.

The merchant fills in a receiving address (auto-filled from the connected wallet for the selected token's chain), amount, token, payment name, and description, then generates a shareable `/p/:id` link through `POST /v1/payroll/request`. An advanced option switches the request to `private` mode, which activates a confidential Near Intents account (`src/lib/confidential/`) and stores a separate `private_recipient_address`.

The generated link does not resolve while the public payer route is disabled. Both halves of this flow are off the released surface; treat them as one unit if either is re-enabled.

Below the form, `ReceivedPaymentList` shows the merchant's requests with their status (`pending`, `submitted`, `completed`, `withdrawing`, `withdrawed`, `failed`), lets them disable a request (`POST /v1/payroll/request/{id}/disable`), and withdraw funds received privately (`useRequestWithdraw` → `POST /v1/payroll/request/withdraw`). `GET /v1/payroll/request/withdraw/count` polls every two minutes for the withdrawable count.

### `/pay/team` — Team

Search, paginated member table (Name, Position, Schedule, Email, Wallet), Add Member, and Invite. List CRUD is mock data (`team` in [mocks.md](mocks.md)) until that contract exists. Schedule is display-only; Add/Edit does not set it, so a new member shows `-`. Wallet prefers EVM, then Solana, then NEAR, then Tron.

Add Member (white dashed border + plus) and Invite (black + link icon) share `TeamActionButtons` with Settings → Organization.

**Add / Edit** is a dialog driven by Settings Integration: Name and EVM are always shown (EVM required). Position is optional. Email / Telegram / Slack / SOLANA / NEAR / Tron render only when that channel is on; Required channels must be filled. Name and Position ≤ 50. A filled wallet must match that chain (`validateAddress`, including Tron). Save stays disabled while a required field is empty or a filled field is invalid.

**Invite** immediately shows `{origin}/invite/{orgId}` (`orgId` is the organization-name slug, or `default`) with Copy. It does not add a row.

Row menu: Edit, Pay Now, Remove. Remove asks for confirmation. **Pay Now** opens `SinglePayoutCard` in a dialog with the member as a locked recipient, then the same hosted-checkout Send Payment path as `/pay`. Members without a wallet cannot Pay Now.

### `/pay/setting` — Settings

`SettingView`. Employee sees Profile only. Admin sees Profile, Organization, and Integration.

**Profile.** Name is editable; Account Email is read-only. Reset Password opens the authed `ResetPasswordDialog`. Save (bottom right) calls `POST /v1/payroll/profile` and updates the session name.

**Organization (admin).** Organization Name and optional Logo URL, same validation as create organization. Add Member / Invite use the same buttons and dialogs as Team. Save (bottom right) mocks `useUpdateOrganizationMutation` and writes `organization.name` onto the session.

**Integration (admin, mock).** Channel of notification: Email, Telegram, Slack. Wallet Address: EVM (always on, Required, no switch), SOLANA, NEAR, Tron. Each unlocked card has a Switch and a Required / Optional dropdown (disabled when the switch is off). Changes write the in-memory mock immediately; there is no Save. Telegram / Slack logos live in `public/setting/`. Email uses `IconEmail`. These settings drive Add Member and Invite Profile Setting.

## Wallet and payout capability

`src/config/chains.ts` is the chain registry: 1Click blockchain code, display name, chain kind, EVM chain id, logo, explorer prefix, and `payerEnabled` / `batchEnabled` flags. It also maps CSV/Sheets aliases (`ethereum` → `eth`, `matic` → `pol`, and so on) so imported rows resolve.

`src/wallet/` holds one adapter per chain kind (`evm/`, `near/`, `solana/`, `tron/`) plus the shared `WalletProvider`, `transfer-deposit.ts`, `broadcast-quick-pay.ts`, and `broadcast-batch-payout.ts`. Features talk to wallets through `useWallet`, `useConnectedWallets`, and `usePaymentWallet` rather than importing an adapter directly.
