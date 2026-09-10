# Product Map

Stableflow Pay lets a signed-in business send stablecoin payouts across EVM, Near, Solana, Tron, and Zcash from a single paying wallet. Cross-chain routing goes through Near Intents (1Click) behind the backend. Native Zcash origin uses Noir Wallet instead of Near Intents.

The backend is the **Payroll** API: every route in `src/api/` is built from `PAY_API_PREFIX`, which is `/v1/payroll`. Auth, hosted checkout (`/payments`), Payment by form (payables + `/payouts/submit`), Organizations, Team, History, Payroll / Expense / Bonus, and Payment requests have live endpoints.

Only two areas are released: **Auth** and **Pay**. This document details the released areas only.

## Areas

| Area | Routes | Status | Notes |
| --- | --- | --- | --- |
| Auth | `/login`, `/register`, `/invite/:orgId` | Released | Detailed below. Reset password is a dialog, not a route. |
| Pay | `/`, `/pay`, `/pay/form`, `/pay/result`, `/pay/payroll`, `/pay/payroll/history`, `/pay/payroll/history/:executionId`, `/pay/expense`, `/pay/expense/requests`, `/pay/expense/history`, `/pay/bonus`, `/pay/bonus/history`, `/team`, `/history`, `/setting`, `/setting/slack/callback`, `/pay/request`, `/pay/requests` | Released | Detailed below. Requires a session. |
| Marketing | `/howitworks` | Live, not detailed here | Static public page linked from the auth screens. |

`/` is Overview inside `PayLayout`. Unmatched paths redirect to `/`. Unsigned visitors then hit `RequireAuth` and land on `/login?returnTo=/`.

## Shell

`AppLayout` (`src/layouts/AppLayout.tsx`) wraps everything except the auth screens and `/howitworks`. On the Pay shell (`/`, `/pay/*`, `/team`, `/history`, `/setting`, `/setting/*`) it is a `#f6f6f6` page with no top header; PayLayout owns the chrome. Other paths get a centred `max-w-[1252px]` container plus `AppHeader`. With only Pay enabled underneath it, the centred branch is currently unreachable.

`AppHeader` (`src/components/layout/`) is unused on the Pay shell. It still holds the logo, `HEADER_NAV_ITEMS`, `HeaderWalletCapsule`, and the capsule variant of `HeaderAccountMenu`.

`PayLayout` (`src/layouts/PayLayout.tsx`) is the authenticated Pay chrome: a 220px left sidebar (`PaySidebar`) with a right divider, a content header (page title from `payTitleForPath`, optional `setHeaderExtra`, and `HeaderWalletCapsule` on the right) with a full-width bottom border, and `PaymentModeTabs` on `/pay` and `/pay/form` for **admin** only (below the header rule). It also mounts `useBatchPayoutCommitQueue()`, which drains the persisted Payment-by-form submit queue in the background and polls the latest payout execution for a bottom-right progress toast. Below `lg` the sidebar is hidden. A compact top row shows the logo (links to `/`), the organization name (`user.organization.name`) stacked above the account menu (avatar, name, dropdown), and a menu button on the right that opens a top Drawer with the role-filtered nav. The wallet capsule is desktop-only.

`PaySidebar` (`src/views/pay/components/PaySidebar.tsx`) is desktop-only (`lg` and up). On `lg` it is sticky to the viewport (`top-0`, `h-svh`) so it does not scroll with the main column; if the nav is taller than the viewport it scrolls inside the aside. It shows `/logo.svg` (links to `/`), the organization name (`user.organization.name`), the sidebar variant of `HeaderAccountMenu` (email trigger; Reset Password / Logout), a horizontal rule under the account, then the nav tree from `payNavItemsForRole` via shared `PayNav`. Active items use a white pill and `#06f` text. Operations is a collapsible group (Payroll, Expense, Bonus) for admin. The Operations row includes a more control that shows a **More Categories** tooltip on hover and opens a right-side Categories drawer (`src/views/categories/`, bottom Drawer below `768px`). Hovering a category card fades a **View Template** control over the table preview; clicking the card opens that category's template preview in the same drawer (back returns to the grid). Turning a card **Switch** on, or clicking **Add Category** in a template, enables that category and appends it under Operations (after Bonus). Enabled ids are stored in the `enabled-categories` Zustand persist store until an API exists. Clicking an enabled category opens `/pay/<category-id>` (admin only). Switching it off removes the nav item. Opening `/pay/<category-id>` when that category is not in Operations shows that type's description, its drawer template, and **Add Category** (enables it and stays on the page). Live category pages (`src/views/categories/components/category-page.tsx`) follow the payroll dashboard layout as an empty state until a category payments API exists: two-column stats (Total Payment / Number of payments), a Total Payment chart plus Recent Payouts, and Payments / Payout History tabs. Payments is **Import or Add** (Download Template, Import CSV via `ImportCsvMenu`, Add Payment). Payout History is **No payout history**. Drawer templates stay sample-row mocks (stats, compact chart, Recent Payouts, Payments / Payout History). KOL&MKT and Grants & Ecosystem Payments use a grouped row (campaign plus expandable accounts, channel pills, and per-account payout). OTC & Treasury Payments uses a single Funding row (address, payout, amount). **Add Category** enables the category, closes the drawer, and opens `/pay/<category-id>`. The same `PayNav` renders inside the mobile top Drawer.

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

**Session.** `useLoginMutation` / `useRegisterMutation` / `useInviteRegisterMutation` call `applySession(token, user)`, which writes `stableflow-pay.session` to `localStorage` and updates `useAuthStore`. `useAuthStore` re-reads that key on first import, so a reload restores the session synchronously. `SessionBootstrap` in `src/App.tsx` runs `useProfileQuery()` to validate the token against `GET /v1/payroll/profile` in the background and refresh the cached user. Tokens that start with `mock:` skip the profile query so remaining mock domains are not logged out by a 401. Admin Settings → Profile Save posts `POST /v1/payroll/profile` (`useUpdateProfileMutation`) with `name`. Member Save posts `POST /v1/payroll/profile/user` (`useUpdateMemberProfileMutation`) with `name`, `organization_id`, and `team_member`. `AuthUser.role` is `"admin"` or `"user"`. Only `"user"` is the member role; any other stored value hydrates as admin. Login, register, profile, and invite-register map `organization` as `{ id, name, logo?, orgId? }` and optional `telegram` / `slack`. Member GET `/profile` also maps optional `team_member` onto the session; login does not return it. `GET /organizations/{id}` writes string `orgId` onto the session when it is missing. `hasOrganization` is true only when that name is non-empty after trim.

**Redirects.** `RequireAuth` sends anonymous visitors to `/login?returnTo=<path+search>`. `RedirectIfAuthed` sends signed-in visitors away from `/login`, `/register`, and `/invite/:orgId` through `postAuthPath` (`returnTo` or `/`). After a successful login or register the view uses the same helper. `safeReturnTo` in `return-to.ts` rejects anything that is not a same-origin absolute path and refuses to bounce back to `/login`, `/register`, `/register/organization`, or `/invite`. Users with role `user` who open `/pay/form`, `/pay/payroll` (including `/pay/payroll/history` and `/pay/payroll/history/:executionId`), `/pay/expense` (including `/pay/expense/requests` and `/pay/expense/history`), `/pay/bonus` (including `/pay/bonus/history`), or `/team` are sent to `/`. Admins who open `/pay/request` or `/pay/requests` are sent to `/`.

**401.** Any authenticated request that returns 401 clears the stored session and calls `notifyUnauthorized()`, which `src/stores/auth.ts` has wired to `logout()` (clears the store and the whole TanStack Query cache). The next render hits `RequireAuth` and lands on `/login`.

## Pay

Files: `src/views/pay/`. Constants: `src/views/pay/config.ts`. Sidebar: `PaySidebar` reads `payNavItemsForRole(user.role)`.

**Admin** sidebar: Overview (`/`), Payment (`/pay` and `/pay/form`), Operations (Payroll at `/pay/payroll`, `/pay/payroll/history`, and `/pay/payroll/history/:executionId`; Expense at `/pay/expense`, `/pay/expense/requests`, and `/pay/expense/history`, with an open-requests count badge; Bonus at `/pay/bonus` and `/pay/bonus/history`), Team (`/team`), History (`/history`), Settings (`/setting`). Request Payment is employee-only.

**Employee** sidebar: Overview (`/`), Payment (`/pay` only, no mode tabs), Request Payment (`/pay/request` and `/pay/requests`), History (`/history`), Settings (`/setting`). No Operations or Team.

Shared building blocks: `TokenSelectDialog` (chain + token picker, optional balances), `PayoutsTable` (Recipient / Amount / Asset / Memo / Time / Status with an explorer link), `RecipientAddressField` + `RecipientsDialog` + `ContactFormDialog` (address book), `PaymentByFormCard` + `PaymentByFormDialog` (Payment by form, including locked-form Pay Now), `PaymentFormDetailsDrawer` (Total Valued details), `SinglePayoutCard` + `SinglePayoutDialog` (Single Payment, including locked-recipient Pay Now), `usePayOriginToken` and `usePaymentWallet` (paying token and matching wallet).

Amounts are limited to `AMOUNT_MAX_DECIMALS` (6) in the inputs, memos to `MEMO_MAX_LENGTH` (200), and slippage is fixed at `QUICK_PAY_SLIPPAGE_TOLERANCE` (5).

### Pay Now dialogs

Reusable Pay Now overlays. Mount them from the page; do not wrap them in another Dialog.

**Which dialog**

- Single payment with a prefilled recipient → `SinglePayoutDialog` (same folder as `SinglePayoutCard`).
- Batch / Payment by form with a locked Form → `PaymentByFormDialog` (same folder as `PaymentByFormCard`).

**`SinglePayoutDialog`**

Import: `@/views/pay/components/single-payout/SinglePayoutDialog`.

Props: `open`, `onClose`, `recipient: { name: string; wallets; email?: string | null } | null`.

Renders `SinglePayoutCard` whenever `recipient` is set (wallets may all be empty). The address field is editable. Current caller: `/team`. Initial address prefers evm → near → solana → tron. Changing the recipient token fills that chain's wallet, or leaves the address empty so the payer can paste one. `email` prefills Notify Recipient.

```tsx
<SinglePayoutDialog
  open={Boolean(paying)}
  recipient={paying ? { name: paying.name, wallets: paying.wallets, email: paying.email } : null}
  onClose={() => setPaying(null)}
/>
```

**`PaymentByFormDialog`**

Import: `@/views/pay/components/payment-form/PaymentByFormDialog`.

Props: `open`, `onClose`, `form: Payable | null`, optional `initialNetPayById`.

Payroll quotes with `POST /v1/payroll/salaries/pay/quote` (`period_month` + browser timezone). Expense and bonus quote with `POST /v1/payroll/expenses/{batch_id}/pay/quote` and `/bonuses/{batch_id}/pay/quote`. Do not send `POST /v1/payroll/batches` from this dialog.

Renders `PaymentByFormCard` with `form` + `formLocked` (Form dropdown disabled). The card does **not** fetch `GET /v1/payroll/payables`; it uses the assembled `Payable`. Optional `initialNetPayById` seeds Details / quote `adjustments`. Closes on successful send (`onSettled`). `/pay/payroll` maps `GET /v1/payroll/salaries/next` through `payrollNextToPayable` (`period_month` = `payment_date`, Form title = that date) and snapshots Next Payroll Net Pay into `initialNetPayById`. `/pay/expense` Open expense maps the open batch through `expenseBatchToPayable`. Request Payments looks up that row's `batch_id` in `GET /v1/payroll/expenses/open/requests` and maps the **whole batch** (not the single row). `/pay/bonus` maps `GET /v1/payroll/bonuses/open` through `bonusItemToPayable`.

```tsx
<PaymentByFormDialog
  open={Boolean(payingForm)}
  form={payingForm}
  initialNetPayById={payingNetPayById}
  onClose={() => setPayingForm(null)}
/>
```

### `/` — Overview

Title **Overview**. `OverviewView` reads `AuthUser.role`. Admin loads `GET /v1/payroll/organizations/overview` (`organization_id` from session `user.organization.id`): organization summary (session `organization.name` / `organization.logo`, owner, `team_members` linking to `/team`, Update Settings linking to `/setting`), a Payments card (`total_payout` / `total_payments` as Total Payment / Number of Payments with View all to `/history`; area chart from `GET /v1/payroll/organizations/payout` with Daily / Weekly / Monthly and the browser timezone; `time` formats to `MMM d` or `MMM`; x-axis ticks thin evenly to the plot width; Volume vs Transaction; Transaction uses `#84A20F`; hover tooltip shows both series; an empty series still draws a zero grid), and High Priority from `GET /v1/payroll/organizations/high-priority` (`title` as the row heading, `description` as the subtitle; `payroll` → `/pay/payroll`, `requests` → `/pay/expense`, `payFailed` → `/history`; the header View All control is commented out). A pending overview shows a layout skeleton (no "Loading..." copy); failure still blocks with an error. Payout and high-priority queries do not block the page. Role `user` loads `GET /v1/payroll/overview` for Total Income / Payment Transaction and Total Payout / Payout Transaction, `GET /v1/payroll/overview/payout` for the grouped Payment Volume bar chart (Income green, Payout purple; Daily / Weekly / Monthly; `time` is the axis label; grid stays visible when a period has no values), `GET /v1/payroll/payment-requests/pending` (`limit` 6) for Open Requests (link to `/pay/requests`; `purpose`, fallback `title`), and `GET /v1/payroll/payment-requests/recent` (`limit` 5) for Recent Payments (link to `/history`; Type from `type`, Purpose from `memo`). Stats pending uses the same skeleton; payout / open / recent do not block the page.

### `/pay` — Single Payment

Title **Payment**. For **admin**, a centred `PaymentModeTabs` control switches Single Payment (`/pay`) and Payment by form (`/pay/form`). Employees do not see the tabs. One card: recipient (search / paste address, address book), amount plus recipient token, and purpose. Changing the address to another chain clears the selected token; a default USDT → USDC → first-available token for that chain is then picked by `defaultDestToken`. The empty submit label is **Starts from adding recipient**; once the form can send it becomes **Send Payment**.

The form lives in `SinglePayoutCard` so `SinglePayoutDialog` can mount the same card with a prefilled recipient. The address book (`RecipientsDialog`) depends on role: **admin** lists Team members with a wallet (`useTeamMembersInfiniteQuery`, scroll to load more, display wallet evm → near → solana → tron) and is select-only (no Add / Edit / Delete; Team is managed on `/team`). Pasting any of a member's wallets still matches the name chip. **Employee** keeps a personal book: create, edit, and delete through `useContacts` → `/v1/payroll/recipients`. A pasted transparent Zcash `t1` / `t3` address (detected before Solana) can receive **ZEC**; Send still posts `/payments` and opens the hosted `pay_url`. Shielded `u1` / `zs1` addresses are rejected.

**Notify Recipient** sits above Send Payment: a Switch plus label, off by default. Turning it on shows an editable email, prefilled from the matched Team member or contact (Team Pay Now also passes `TeamMember.email`). Changing the recipient address refills the email. Send posts to `/v1/payroll/payments` (`useCreatePayrollPaymentMutation`) with the amount, the recipient, the destination `network` / `symbol` from `payoutNetworkToken`, the optional purpose (`memo` on the API), `success_url` = `{origin}/pay/result`, and when the switch is on a valid email, `notification: { email }`. Empty `slack` is omitted. An empty or invalid email while the switch is on blocks the request. The backend creates a hosted checkout session and answers with `pay_url`; the browser is sent there with `window.location.assign`. Payment itself happens on the hosted checkout, so this screen never touches a wallet.

### `/pay/form` — Payment by form

Title **Payment**. Same `PaymentModeTabs` as Single Payment. The page wraps `PaymentByFormCard` in a 600px card. `PaymentByFormDialog` (Pay Now from Payroll / Expense / Bonus) mounts the same card with a pre-assembled `form` + `formLocked` and does not read payables. `?batch_id=` from a member payment-request link waits for `GET /v1/payroll/payables`, then selects the expense row with that `batchId` (dropdown stays enabled). Missing match toasts **Payment form not found** once and leaves the form unselected. A successful send `replace`s the URL to drop `?batch_id=`. That quote uses `POST /v1/payroll/expenses/{batch_id}/pay/quote`.

The Form dropdown lists `GET /v1/payroll/payables` (`organization_id` from session, `timezone` from `browserTimeZone()`). Types are `payroll` / `expense` / `bonus` (expense still shows as Reimbursement). Unknown types are dropped. While the list is pending, the trigger and open panel show a loading spinner. An empty list still opens and shows **No forms**. The option panel is `max-h-60` with internal scroll. Picking a row loads its `list` items, then the payer chooses the You Pay wallet, chain, and token (`YouPaySection` with `BATCH_BLOCKCHAINS`). Native Zcash origin is allowed only when that form has one recipient: You Pay connects Noir Wallet and broadcasts `transaction.outputs[0]` through `broadcastBatchPayout`. When `items.length > 1`, the Zcash chain stays visible but disabled with tooltip **Zcash does not support batch payments yet** (`disabledBlockchains: ["zec"]`); a saved ZEC origin is skipped. ZEC on Near or Solana still uses those chains' existing batch txs. That posts the matching quote endpoint (`usePayablePayQuery`) and fills You Pay / Est. Cost from `totalSourceAmount`. **Send Payment** signs and broadcasts with `broadcastBatchPayout` and `consumed-batches`, then enqueues `POST /v1/payroll/payouts/submit` (`quote_id` + `tx_hash`). Submit returns `execution_id`; PayLayout polls `GET /v1/payroll/executions/{execution_id}` every 5s and shows a bottom-right progress toast (`N / N Transactions are in progress...`; when finished, `N / N Transactions completed`, then auto-close after 3s). An expired or already-consumed `batchId` toasts and POSTs quote again. After EVM approve, if allowance is still below the quoted amount, Send toasts **Insufficient approval. Refreshing the quote.** and POSTs quote again so the backend can rebuild `approvals` calldata; the payer clicks Send Payment again (no automatic second wallet popup). Empty CTA is **Select Category**. Pay bodies omit `adjustments` until Details Save (or `/pay/payroll` Pay Now `initialNetPayById`) changes a row's net pay relative to list `net_pay` (or `amount` when `net_pay` is missing). Only changed `{ item_id, net_pay }` rows are sent. `adjustments` is part of the quote query key so a Save re-quotes.

**Notify Recipient** sits above Send Payment. Off by default. On, the right side shows `{n} Email` (`n` = item count). Clicking it opens a Notify Recipients drawer (right side from `768px` up, bottom sheet below): a master Switch, recipient name + email rows, and a checkbox per `item_id`. Rows start selected. Turning the card switch off, the drawer Switch off, or unchecking every row closes the drawer and turns Notify off. Selected ids go on the pay body as `notification`: `"all"` when every item is checked, otherwise comma-separated `item_id`s. That string is part of the quote query key. Payroll / Expense / Bonus CSV import does not collect Notify.

After a form is selected, Total Valued shows a Details control that opens a drawer (right side from `768px` up, bottom sheet below). The drawer lists Total Value, recipient count, and Next Pay-date only for payroll. Each recipient shows name, email, address, payout preference, amount, and net pay. Total Valued on the card and Total Value in the drawer are the sum of item `volume` (USD), falling back to the form `total_payout` when every item lacks volume. Net-pay overrides do not change that USD total. The drawer Total Value uses the default `$` prefix. Amount and Net Pay stay token quantities (`prefix: ""`, `AMOUNT_MAX_DECIMALS` = 6). Header **Edit** / **Save** (`size=sm`, `h-[30px] w-[84px]`): Edit turns only Net Pay into `InputNumber` (`AMOUNT_MAX_DECIMALS` = 6), defaulting to list `net_pay` or `amount`. Amount and the other columns stay read-only. Save runs `parsePositiveDecimal` on every row; empty or ≤0 toasts and stays in edit. A successful Save writes only changed overrides and exits edit. Closing the drawer or changing form drops an unsaved draft; saved overrides clear when the selected form changes. No separate Edit dialog.

### `/pay/result` — Payment Result

Where the hosted checkout returns after a **successful** payment; it is not in the sidebar, and `PAY_ROUTE_TITLES` supplies its layout title. The checkout appends `amount`, `network`, `expires_at`, `created_at`, `out_order_no`, `recipient`, `session_id`, `status`, `symbol`, `destination_txHash`, `paid_at`, and `tx_hash` to the URL; `parsePayoutCallbackParams` reads them.

`out_order_no` carries the Payroll `payment_id`, which the page passes to `GET /v1/payroll/payments/{payment_id}` (`usePayrollPaymentQuery`, read once — the checkout only returns on success, so there is nothing to poll). Until that resolves, and if it fails or `out_order_no` is missing, the page renders from the callback query alone; the memo and the paying-side amount only appear once the lookup succeeds.

### `/pay/payroll` — Payroll

Files: `src/views/payroll/`. API: [api.md](api.md) salaries endpoints.

Dashboard for the Operations → Payroll nav item. The same view renders on `/pay/payroll` (Next Payroll), `/pay/payroll/history` (Payroll History), and `/pay/payroll/history/:executionId` (history detail drawer). The tab row is `NavLink`s; History matches the `/pay/payroll/history` prefix so the detail URL keeps that tab active. Stats (`GET /v1/payroll/salaries/current`), a total-payroll chart with Daily / Weekly / Monthly (`GET /v1/payroll/salaries/total-payout` `period` `day` / `week` / `month`), recent payouts with scroll-to-load (`GET /v1/payroll/salaries/recent`; a row navigates to `/pay/payroll/history`; polls every 30s while any row is `pending`, paused in the background), Next Payroll (`GET /v1/payroll/salaries/next`), and Payroll History (`GET /v1/payroll/salaries/history`, paginated). Next Payroll rows show email after address. **View Details** on a history card navigates to `/pay/payroll/history/{executionId}` and opens the right-side drawer (Figma `2766:18971`) with `GET /v1/payroll/salaries/history/{execution_id}`. The export button next to **View Details** downloads that run's CSV via `GET /v1/payroll/salaries/history/{execution_id}/export` (`organization_id`, `timezone`). Payroll History and the open detail drawer poll every 5s while any row is `pending` (paused in the background). Closing the drawer returns to `/pay/payroll/history`. A missing list row still opens the drawer with that `executionId`; the detail request loads the rest. Failed rows show **Pay Again**, which posts `POST /v1/payroll/payouts/retry` (`execution_item_id`, `organization_id`, `success_url` `{origin}/pay/payroll/history/{executionId}`) and sends the browser to `pay_url`. Checkout return query params are ignored. Each live block has its own loading state. An empty or failed next-payroll request shows the create-payroll CTA (Download Template, Import CSV, Add Payroll). **Add Payroll** / **Add a new Payroll** and **Edit** open a right-side drawer (`Add Payroll` / `Edit Payroll`). Set Pay Date offers First day of month, Last day of month, and Day of month. Day of month opens a 1–31 picker; choosing 1 or 31 still saves as `first_day` / `last_day`. **Import CSV** (Choose file or Google Docs) parses on this page and opens the Add Payroll drawer with the rows; when Google is signed in, Sign out appears next to Google Docs to switch accounts. **Save** posts `POST /v1/payroll/salaries/import` and stays on `/pay/payroll`. Edit drawer **Save** posts `POST /v1/payroll/salaries/update` (existing row ids, new rows without id, removed ids in `delete_ids`) and stays on `/pay/payroll`. Payroll History **Export CSV** calls `GET /v1/payroll/salaries/history/export` (`organization_id`, `timezone`) and is hidden on Next Payroll. **Pay Now** opens `PaymentByFormDialog` with `{ type: "payroll", periodMonth }` from Next Payroll `payment_date` when `GET /v1/payroll/salaries/next` `payable` is true, and passes the table Net Pay values as `initialNetPayById` so quote `adjustments` include rows that differ from payables `net_pay`. When `payable` is false the button stays enabled visually, the label is **Not payday yet**, and the click does not open the dialog. Missing `payable` is treated as true.

### `/pay/expense` — Expense

Files: `src/views/expense/`. API: [api.md](api.md) expenses endpoints.

Dashboard for the Operations → Expense nav item. The same view renders on `/pay/expense` (Open expense), `/pay/expense/requests` (Request Payments), and `/pay/expense/history` (Expense History); the tab row is `NavLink`s. Admin `/pay/expense/requests` is not the employee `/pay/requests` page. Stats (`GET /v1/payroll/expenses/current`), a total-expense chart with Daily / Weekly / Monthly (`GET /v1/payroll/expenses/total-payout` `period` `day` / `week` / `month`), recent payouts with scroll-to-load (`GET /v1/payroll/expenses/recent`; a row navigates to `/pay/expense/history`; polls every 30s while any row is `pending`, paused in the background), Open expense (`GET /v1/payroll/expenses/open`), Request Payments (`GET /v1/payroll/expenses/open/requests`), and Expense History (`GET /v1/payroll/expenses/history`, paginated; polls every 5s while any row is `pending`, paused in the background). History Description / Receipt matches Request Payments Description (http(s) URLs are links with a receipt icon before each URL; confirm opens a new tab). History Status is Failed, Paid, or Pending (`processing` maps to pending). `GET /v1/payroll/expenses/open/requests/count` is polled from `PayLayout` every 60s (paused in the background; refetch on focus) and drives the Operations → Expense sidebar badge and the Request Payments tab badge (hidden when `count` is 0). Each live block has its own loading state. An empty open-expense list shows the create-expense CTA (Download Template, Import CSV, Add Expense) and hides the tab toolbar. Request Payments hides the toolbar; an empty list shows "No payment requests". When Open expense has batches, or on Expense History, the tab toolbar shows **Import CSV** and **Add Expense**. **Import CSV** (Choose file or Google Docs) parses locally and opens the **Add Expense** drawer with the rows; when Google is signed in, Sign out appears next to Google Docs to switch accounts. **Add Expense** opens the same drawer empty. **Save** posts `POST /v1/payroll/expenses/import` (`title` plus items), then navigates to `/pay/expense`. History search and the date range are sent as `search` / `start_time` / `end_time`. **Export CSV** downloads `GET /v1/payroll/expenses/history/export` with those same filters (no `page` / `pageSize`). Open expense keeps each batch as a grouped row (Title / Name / Address / Payout Preference / Amount; one member shows name and address, more than one expands; Pay Now on the batch header). Request Payments stays one person per row. **Pay Now** (not Paying) opens `PaymentByFormDialog` with `{ type: "expense", batchId }` from that batch.

### `/pay/bonus` — Bonus

Files: `src/views/bonus/`. API: [api.md](api.md) bonuses endpoints.

Dashboard for the Operations → Bonus nav item. The same view renders on `/pay/bonus` (Bonuses to be paid) and `/pay/bonus/history` (Bonus History); the tab row is `NavLink`s. Stats (`GET /v1/payroll/bonuses/current`), a total-bonus chart with Daily / Weekly / Monthly (`GET /v1/payroll/bonuses/total-payout` `period` `day` / `week` / `month`), recent payouts with scroll-to-load (`GET /v1/payroll/bonuses/recent`; a row navigates to `/pay/bonus/history`; polls every 30s while any row is `pending`, paused in the background), Bonuses to be paid (`GET /v1/payroll/bonuses/open`), and Bonus History (`GET /v1/payroll/bonuses/history`, paginated). Each live block has its own loading state. An empty open list shows the create-bonus CTA (Download Template, Import CSV, Add Bonus) and hides the tab toolbar. When Bonuses to be paid has items, the tab toolbar shows **Import CSV** and **Add Bonus**. **Import CSV** (Choose file or Google Docs) parses locally and opens the **Add Bonus** drawer with the rows; when Google is signed in, Sign out appears next to Google Docs to switch accounts. **Add Bonus** opens the same drawer empty. **Save** posts `POST /v1/payroll/bonuses/import` (`title` plus items), then navigates to `/pay/bonus`. Bonus History **Export CSV** downloads `GET /v1/payroll/bonuses/history/export` (`organization_id`; no `page` / `pageSize`). Open batches stay grouped: a one-member row shows the name and address, a multi-member row expands. `status` `paying` / `processing` / `submitted` shows Paying; anything else is Pay Now with `{ type: "bonus", batchId }` from that batch.

### `/history` — Transaction History

Admin loads `GET /v1/payroll/organizations/history`; members load `GET /v1/payroll/history`. Both send session `organization_id`. Top bar: Search (`q`, debounced 300ms), `DateRangePicker` (last 30 days → `start_time` / `end_time` unix seconds), Export CSV of the current filter result (`.../history/export`, no pagination). Card toolbar: members also have Type (`All` / `Income` / `Payout`); then Source Network, Source Token, Destination Network, Destination Token, Status (`All` / `Created` / `Processing` / `Completed` / `Failed` / `Expired`). Network options are `FIXED_CHAINS` plus All; token options are `PAYOUT_SYMBOLS` plus All. Every filter change resets to page 1. There is no Amount filter. The table Status column is green (`#84A20F`) for completed, red (`#FF5656`) for failed / expired, and black for created / processing.

Columns: Amount, Source, arrow, Received, Destination, From, To, Time, Status. Member rows prepend **Type** (`Income` / `Payout`) and sign Amount (`+` green `#84A20F` for income, `-` red `#FF5656` for payout). Source / Destination show token logo and `SYMBOL · Chain`. From / To truncate the address, copy it, and open the tx explorer (`txHash` on the source chain, `destinationTxHash` on the destination). Pagination sits in the card footer.

### `/pay/request` and `/pay/requests` — Request Payment

Employee-only. Header tabs replace the layout title: **Request Payment** (`/pay/request`) and **Requests** (`/pay/requests`). Admins who open either path are sent to `/`. Overview Open Requests "View All" goes to `/pay/requests`.

The form is Purpose (required, `purpose` on the API; help tooltip explains it is the short name the payer sees), optional Description (`description`), Payment setting (amount + token via `TokenSelectDialog`), and Receiving Address. Address autofill prefers `GET /v1/payroll/payment-requests/default-addresses` for the selected token chain, then the connected wallet. **Save as default** is a toggle; Generate sends `set_default_address`. There is no private / Receive Privately mode.

**Generate Payment Request** posts `POST /v1/payroll/payment-requests`. On success a dialog shows `{origin}/pay/form?batch_id={batch_id}` (admin Payment by form) and the form resets. **Copy Link** copies it. There is no Preview control.

`/pay/requests` lists **My Requests** from `GET /v1/payroll/payment-requests` (`page` / `pageSize` 10, no `status`). Columns: Request for (`purpose`, copy-link control, created time), Request to pay (`amount SYMBOL · Chain`), Receive Address, Paid Address, Paid Time, Status. Status is Pending (`pending` / `created` / `processing`, `#3f8afb`), Complete (`completed`, `#84a20f`), or Failed (`failed` / `expired`). A receive `destination_tx_hash` / `tx_hash` shows an explorer link on Status. Pagination sits in the card footer. There is no withdraw, disable, or refresh switch.

### `/team` — Team

Search, paginated member table (Name, Position, Email, Wallet), Add Member, and Invite. List CRUD uses `/v1/payroll/team/members`. Search `q` is debounced 300ms (name, email, position, evm address). Page size is 10. Wallet prefers evm, then near, then Solana, then Tron.

Add Member (white dashed border + plus) and Invite (black + link icon) share `TeamActionButtons` with Settings → Organization.

**Add / Edit** is a dialog driven by Settings Integration from `GET /v1/payroll/organizations/{id}`: Name is always shown. Position is optional. Wallet and notification fields render only when that channel is on; Required channels must be filled (EVM is required by the backend). Name and Position ≤ 50. A filled wallet must match that chain (`validateAddress`, including Tron). Save stays disabled while a required field is empty or a filled field is invalid. Non-empty Telegram and Slack are sent as `telegram_chat_id` / `slack_user_id` on create and update; empty handles are omitted. Edit prefills saved handles.

**Invite** shows `{origin}/invite/{org_id}` (string `org_id`, URL-encoded) with Copy. It does not add a row. Invite is unavailable until that string id is loaded.

Row menu: Edit, Pay Now, Remove. Remove asks for confirmation. **Pay Now** always opens `SinglePayoutDialog` with the member's name and wallets. The address field is editable. The first filled wallet is prefilled (evm → near → solana → tron); changing the recipient token switches to that chain's wallet, or leaves the field empty so the payer can type or paste one.

### `/setting` — Settings

`SettingView`. Employee sees Profile only. Admin sees Profile, Organization, and Integration.

**Profile.** Name is editable; Account Email is read-only. Reset Password opens the authed `ResetPasswordDialog`. Admin Save (bottom right) calls `POST /v1/payroll/profile` and updates the session name. Members also see Position (optional, max 50), EVM Wallet Address, then Solana / NEAR / Tron / Slack / Telegram when those organization `address_settings` / `notification_settings` channels are on. Save calls `POST /v1/payroll/profile/user` with `name`, `organization_id`, and `team_member` (`position`, wallet addresses, `slack_user_id`, `telegram_chat_id`; empty keys omitted). Prefill comes from GET `/profile` `team_member`.

**Organization (admin).** `GET /v1/payroll/organizations/{id}` hydrates Organization Name, optional Logo URL, Integration settings, and string `org_id` (the item matching `id`, or the first row). Same name/logo validation as register organization. Add Member / Invite use the same buttons and dialogs as Team. Save (bottom right) posts `POST /v1/payroll/organizations/{id}` with the current name and optional logo (`useUpdateOrganizationMutation`) and writes `organization.name` / `logo` onto the session. Address and notification settings are not sent on this route.

**Integration (admin).** Channel of notification: Email (locked Required, like EVM), Telegram (commented out), Slack. Wallet Address: EVM (locked Required, no switch; the backend keeps `evm_address` required), SOLANA, NEAR, Tron. Each unlocked card has a Switch and a Required / Optional dropdown (disabled when the switch is off). Changes save immediately: address cards POST the one changed field to `/organizations/{id}/address-settings`; Slack off or Required / Optional POSTs `/notification-settings`. There is no Integration Save button. Turning Slack on calls `POST /organizations/{id}/slack/connect` and assigns `authorization_url`. Slack then returns to `/setting/slack/callback?code=&state=`, which POSTs `/slack/oauth` and then `/notification-settings` with `slack: required`, then redirects to `/setting`. Closing Slack or switching Required does not re-authorize. Telegram / Slack logos live in `public/setting/`. Email uses `IconEmail`. These settings drive Add Member and Invite Profile Setting.

## Wallet and payout capability

`src/config/chains.ts` is the chain registry: 1Click blockchain code, display name, chain kind, EVM chain id, logo, explorer prefix, and `payerEnabled` / `batchEnabled` flags. It also maps CSV/Sheets aliases (`ethereum` → `eth`, `matic` → `pol`, and so on) so imported rows resolve.

`src/wallet/` holds one adapter per chain kind (`evm/`, `near/`, `solana/`, `tron/`, `zec/`) plus the shared `WalletProvider`, `broadcast-quick-pay.ts`, and `broadcast-batch-payout.ts`. Zcash uses Noir Wallet (`@noir-wallet/sdk`); only the connected **transparent** address is the payer. Features talk to wallets through `useWallet`, `useConnectedWallets`, and `usePaymentWallet` rather than importing an adapter directly.
