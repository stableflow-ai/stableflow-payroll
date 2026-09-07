# API Layer

Every backend call goes through `http()` / `httpBlob()` in `src/lib/http.ts`. The base origin is `VITE_API_BASE_URL`; the browser calls it directly and there is no Vite dev proxy. `http()` throws `ApiError("API base URL is not configured", 500, "CONFIG")` when the variable is empty.

## Layers

```
view / component
      |  useQuery / useMutation
hooks/use-<domain>-api.ts        query keys, enabled flags, cache invalidation
      |
api/<domain>.ts                  one function per endpoint, response mapping
      |
lib/http.ts                      URL, query string, auth header, envelope, errors
```

| Concern | Owner |
| --- | --- |
| Server data (lists, details, quotes) | TanStack Query, keyed through `src/api/query-keys.ts` |
| Auth token on the wire | `lib/http.ts` reads it from `lib/auth-session.ts` |
| Session state in the UI | `useAuthStore` (`src/stores/auth.ts`) |
| Anything else cross-page and client-side | Zustand stores in `src/stores/` |

Do not call `fetch` from a view, and do not copy server data into Zustand.

## Envelope

The backend answers with `{ code, data, message }`. `http()` returns `data` when `code === 200` and throws `ApiError(message, status, code)` otherwise. A `DELETE` that returns an empty body with a 2xx status resolves to `undefined`.

```ts
export class ApiError extends Error {
  status: number;   // HTTP status
  code?: string;    // envelope code when present
}
```

`/v1/nearintents/*` proxies 1Click and may return the upstream JSON as-is, so those calls pass `envelope: false`. In that mode a `code === 200` envelope is still unwrapped, a non-200 envelope still throws, and anything else is returned untouched.

## Auth header

`auth` defaults to `true`: `http()` reads the token with `getAuthToken()` and sends `Authorization: Bearer <token>`. With no token it throws `ApiError("Not authenticated", 401, "UNAUTHENTICATED")` before hitting the network.

Pass `auth: false` for endpoints that must work signed out (login, register, reset password). Endpoints that work either way take an option and forward the caller's choice — `singleQuote`, `singleSwap`, `singleSubmit`, and `getPayRequest` do this so `RequestPayView` can call them anonymously. That page's route (`/p/:id`) is currently disabled, but keep the option: it is the only reason those four are not hard-wired to `auth: true`.

A 401 on an authenticated request clears the stored session and calls `notifyUnauthorized()`, which `src/stores/auth.ts` has bound to `logout()`.

## Adding an endpoint

1. Add the request and response types to `src/types/<domain>.ts`.
2. Add a function to `src/api/<domain>.ts` that calls `http()` with the path built from `PAY_API_PREFIX`.
3. Map loose backend shapes with `asRecord` / `apiText` / `apiNumber` from `src/api/map.ts` instead of casting. The backend mixes `snake_case` and `camelCase`; existing mappers read both.
4. For a query, add a namespace or entry to `src/api/query-keys.ts`. Mutations do not need a key.
5. Add the hook to `src/hooks/use-<domain>-api.ts`. Gate authenticated queries with `enabled: Boolean(token)` from `useAuthStore`.
6. Invalidate related keys in the mutation's `onSuccess`.
7. Append the route to the [endpoint table](#endpoints) below.

### Query keys

```ts
export const queryKeys = {
  payout: {
    all: ["payout"] as const,
    pending: ["payout", "pending"] as const,
    payments: (params: unknown) => [...queryKeys.payout.all, "payments", params] as const,
  },
} as const;
```

Keep every key for a domain under one `all` prefix so a mutation can invalidate the whole domain with `invalidateQueries({ queryKey: queryKeys.payout.all })`.

### `http()` options

```ts
export interface HttpOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;                                 // JSON-encoded, sets Content-Type
  query?: Record<string, string | number | boolean | null | undefined>;
  auth?: boolean;                                 // default true
  envelope?: boolean;                             // default true
}
```

`undefined` and `null` query values are dropped. `httpBlob()` takes the same options minus `envelope`, plus `fallbackFilename`, and resolves to `{ blob, filename }` where `filename` comes from `Content-Disposition` (see `filenameFromContentDisposition`).

### Hook usage

```ts
export function usePaymentsQuery(params: PayPaymentsQuery) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.payout.payments(params),
    queryFn: () => getPayments(params),
    enabled: Boolean(token),
  });
}
```

```tsx
const loginMutation = useLoginMutation();

const session = await loginMutation.mutateAsync({ email, password });  // writes the session
navigate(postAuthPath(session.user, returnTo));
```

## Endpoints

Paths are prefixed with `PAY_API_PREFIX` (`/v1/payroll`) or `NEARINTENTS_API_PREFIX` (`/v1/nearintents`) from `src/api/config.ts`. "Auth" is the default for that function; `caller` means the caller decides.

Only Auth, Single Payout (`/payments`), Batch Payout (`/batches`), Organizations, Team members, Recipients, and the Payroll salaries / expenses / bonuses dashboard endpoints are served by the Payroll backend. The Payout and Payment-request tables are the pre-Payroll contract kept unchanged under the new prefix; the screens that call them are not in scope yet, so those routes will 404. Do not treat them as a spec.

### Auth — `src/api/auth.ts`, `src/types/auth.ts`, `src/hooks/use-auth-api.ts`

| Method | Path | Auth | Body | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/v1/payroll/auth/login` | no | `LoginBody` | `AuthSession` | `login` | `useLoginMutation` |
| POST | `/v1/payroll/auth/register` | no | `RegisterBody` | `AuthSession` | `register` | `useRegisterMutation` |
| POST | `/v1/payroll/auth/register/user` | no | `RegisterUserBody` | `AuthSession` | `registerUser` | `useInviteRegisterMutation` |
| POST | `/v1/payroll/change-password` | yes | `ChangePasswordBody` | — | `changePassword` | `useChangePasswordMutation` |
| POST | `/v1/payroll/reset-password/code` | no | `ResetPasswordCodeBody` | — | `sendResetPasswordCode` | `useSendResetPasswordCodeMutation` |
| POST | `/v1/payroll/reset-password` | no | `ResetPasswordBody` | — | `resetPassword` | `useResetPasswordMutation` |
| GET | `/v1/payroll/profile` | yes | — | `AuthUser` | `getProfile` | `useProfileQuery` |
| POST | `/v1/payroll/profile` | yes | `UpdateProfileBody` | — | `updateProfile` | `useUpdateProfileMutation` |

`AuthUser` includes `role`: `"admin"` | `"user"`, optional `telegram` / `slack`, and optional `organization?: { id: number; name: string; logo?: string; orgId?: string } | null`. `login`, `register`, `registerUser`, and `getProfile` map that payload with `mapAuthUser` / `mapAuthSession`. Only `"user"` is stored as the member role; any other value, including a missing role, hydrates as admin. Register body includes required `organization.name` and optional `organization.logo`. Empty telegram / slack handles are omitted from the mapped user. Invite-register (`POST /auth/register/user`, `src/hooks/use-invite-api.ts`) sends string `org_id` and omits empty optional wallet / handle fields. Profile POST still sends only `name`.

### Organizations — `src/api/organization.ts`, `src/types/organization.ts`, `src/hooks/use-admin-overview-api.ts`, `src/hooks/use-organization-api.ts`, `src/hooks/use-settings-api.ts`, `src/hooks/use-invite-api.ts`

| Method | Path | Auth | Body / Query | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/v1/payroll/organizations/overview` | yes | `organization_id` | `OrganizationOverview` | `getOrganizationOverview` | `useOrganizationOverviewQuery` |
| GET | `/v1/payroll/organizations/payout` | yes | `organization_id`, `period`, `timezone` | `OrganizationPayoutPoint[]` | `getOrganizationPayout` | `useOrganizationPayoutQuery` |
| GET | `/v1/payroll/organizations/high-priority` | yes | `organization_id`, `timezone` | `OrganizationHighPriorityItem[]` | `getOrganizationHighPriority` | `useOrganizationHighPriorityQuery` |
| GET | `/v1/payroll/organizations/{id}` | yes | path `id` | `OrganizationItem[]` | `getOrganization` | `useOrganizationQuery` |
| GET | `/v1/payroll/organizations/info/{org_id}` | no | path `org_id` (string) | `OrganizationPublicInfo` | `getOrganizationInfo` | `useInvitePreviewQuery` |
| POST | `/v1/payroll/organizations/{id}` | yes | `UpdateOrganizationBody` | — | `updateOrganization` | `useUpdateOrganizationMutation` |

Integer `organization_id` / path `{id}` come from session `user.organization.id` and are unchanged for overview, payout, high-priority, and team. Queries and the update mutation do not fire when that id is missing. `GET /organizations/{id}` also returns string `org_id`, `address_settings`, and `notification_settings` (`disabled` / `optional` / `required`; blank or unknown maps to `disabled`). The string `org_id` is written onto the session as `organization.orgId` and is the only id used for invite URLs, `GET .../info/{org_id}`, and `POST /auth/register/user`. Settings picks the GET row whose `id` matches, or the first row. Organization Save and Integration Save both POST `name`, optional `logo`, and both settings objects; empty `logo` is omitted. Integration keeps EVM locked (`evm_address` stays the GET value). `period` is the existing `VOLUME_PERIOD` (`day` / `week` / `month`). `timezone` is `browserTimeZone()`. High-priority `category` values are `payroll` / `payFailed` / `paymentRequest`; unknown values are dropped.

### Team members — `src/api/team.ts`, `src/types/team.ts`, `src/hooks/use-team-api.ts`

| Method | Path | Auth | Body / Query | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/v1/payroll/team/members` | yes | `organization_id`, `page`, `pageSize`, `q?` | `TeamMembersPage` | `getTeamMembers` | `useTeamMembersQuery` / `useTeamMembersInfiniteQuery` |
| POST | `/v1/payroll/team/members` | yes | `TeamMemberWrite` + `organization_id` | `TeamMember` | `createTeamMember` | `useTeamMemberMutations` |
| POST | `/v1/payroll/team/members/{member_id}` | yes | `TeamMemberWrite` | `TeamMember` | `updateTeamMember` | `useTeamMemberMutations` |
| DELETE | `/v1/payroll/team/members/{member_id}` | yes | — | — | `deleteTeamMember` | `useTeamMemberMutations` |

`organization_id` comes from session `user.organization.id`. Queries and create do not fire when that id is missing. `q` searches name, email, position, and `evm_address`. Empty `email` / `position` / wallet fields are omitted from POST bodies. Telegram and Slack are not sent. The Team table uses paged `useTeamMembersQuery`; the admin Recipients address book uses `useTeamMembersInfiniteQuery` (`pageSize` 20).

### Payments (hosted checkout) — `src/api/payout.ts`, `src/types/payout.ts`, `src/hooks/use-single-payout-api.ts`

| Method | Path | Auth | Body | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/v1/payroll/payments` | yes | `PayrollCreatePaymentParam` | `PayrollPayment` | `createPayrollPayment` | `useCreatePayrollPaymentMutation` |
| GET | `/v1/payroll/payments/{payment_id}` | yes | — | `PayrollPayment` | `getPayrollPayment` | `usePayrollPaymentQuery` |

`POST /payments` does not settle anything. The backend opens a hosted checkout session and answers with `pay_url`; `SinglePayoutView` sends the browser there, and the payer completes the transfer on the checkout. `createPayrollPayment` throws `ApiError(..., "NO_PAY_URL")` when the response has no link.

`memo` (≤ 200 characters) is accepted but is not in the Swagger contract. Optional `notification: { email?, slack? }` is sent from Single Payment when Notify Recipient is on; empty keys are omitted. The switch-off path omits `notification` entirely.

The checkout returns to the `success_url` we send (`{origin}/pay/result`) only after a successful payment, with `out_order_no` set to the Payroll `payment_id`. `PayoutResultView` reads it and calls `GET /payments/{payment_id}` once — there is no state left to poll for.

### Batch payout — `src/api/payout.ts`, `src/types/payout.ts`, `src/hooks/use-batch-payout-api.ts`

| Method | Path | Auth | Body | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/v1/payroll/batches` | yes | `PayrollCreateBatchParam` | `PayrollBatch` | `createPayrollBatch` | `useCreatePayrollBatchQuery` |
| GET | `/v1/payroll/batches/{batch_id}/transaction` | yes | — | `PayrollBatch` | `getPayrollBatchTransaction` | `usePayrollBatchTransactionQuery` |

`POST /batches` creates the batch and answers with the origin quote (`total_source_amount` / `total_source_amount_raw`) plus the origin-chain `transaction` to sign. `BatchPayoutView` posts once when preview opens; the refresh control and an expired/spent quote call `refetch()`. `createPayrollBatch` throws `ApiError(..., "NO_BATCH_TX")` when the response has no broadcastable transaction.

Confirm signs and broadcasts that transaction. There is no submit call after broadcast. `GET .../transaction` is a status lookup; the page does not call it (success resets to the upload step). A consumed `batchId` is stored in `consumed-batches` before broadcast so the same deposit addresses are never paid twice.

`notification.email` / `notification.slack` are omitted: `/pay/batch` does not collect them.

### Payment by form — `src/api/payable.ts`, `src/types/payable.ts`, `src/hooks/use-payable-api.ts`

| Method | Path | Auth | Body / Query | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/v1/payroll/payables` | yes | `organization_id`, `timezone` | `Payable[]` | `getPayables` | `usePayablesQuery` |
| POST | `/v1/payroll/salaries/pay` | yes | `PayrollPayParam` | `PayrollBatch` | `payPayrollSalaries` | `usePayablePayQuery` |
| POST | `/v1/payroll/expenses/{batch_id}/pay` | yes | `PayablePayBaseParam` | `PayrollBatch` | `payExpenseBatch` | `usePayablePayQuery` |
| POST | `/v1/payroll/bonuses/{batch_id}/pay` | yes | `PayablePayBaseParam` | `PayrollBatch` | `payBonusBatch` | `usePayablePayQuery` |

`organization_id` is session `user.organization.id`. `timezone` is `browserTimeZone()`. Rows whose `type` is not `payroll` / `expense` / `bonus` are dropped. Payroll keys use `period_month`; expense and bonus keys use `batch_id`. `list[].email` is mapped when present.

The three pay routes return `{ batch, execution_id }`. The mapper reads `batch` through `mapPayrollBatch` and throws `ApiError(..., "NO_BATCH_TX")` when the transaction cannot be broadcast. `PaymentByFormCard` posts pay as the quote (`usePayablePayQuery`, `staleTime: Infinity`); Send uses `markBatchConsumed` then `broadcastBatchPayout`. Expired or consumed quotes refetch pay. Optional `notification` is an array of selected `item_id`s. `adjustments` is `{ item_id, net_pay }[]` for every item (override after Details Save, otherwise payable `netPay`) and is omitted only when the form has no items. Both fields are part of the quote query key. `payablePayBody` copies a non-empty `adjustments` array onto all three pay bodies.

### Payroll salaries — `src/api/payroll.ts`, `src/types/payroll.ts`, `src/hooks/use-payroll-api.ts`

| Method | Path | Auth | Query | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/v1/payroll/salaries/current` | yes | `organization_id`, `timezone` | `PayrollCurrentStats` | `getPayrollCurrentStats` | `usePayrollCurrentStatsQuery` |
| GET | `/v1/payroll/salaries/total-payout` | yes | `organization_id`, `period`, `timezone` | `PayrollTotalPayoutPoint[]` | `getPayrollTotalPayout` | `usePayrollTotalPayoutQuery` |
| GET | `/v1/payroll/salaries/recent` | yes | `organization_id`, `limit` | `PayrollRecentPayout[]` | `getPayrollRecentPayouts` | `usePayrollRecentPayoutsInfiniteQuery` |
| GET | `/v1/payroll/salaries/next` | yes | `organization_id`, `timezone` | `PayrollNextRun \| null` | `getPayrollNext` | `usePayrollNextQuery` |
| GET | `/v1/payroll/salaries/history` | yes | `organization_id`, `page`, `pageSize`, `timezone` | `PayrollHistoryResp` | `getPayrollHistory` | `usePayrollHistoryInfiniteQuery` |
| GET | `/v1/payroll/salaries/history/{execution_id}` | yes | `organization_id`, `timezone` | `PayrollHistoryDetail` | `getPayrollHistoryDetail` | `usePayrollHistoryDetailQuery` |
| GET | `/v1/payroll/salaries/history/export` | yes | `organization_id`, `timezone` | CSV file | `exportPayrollHistory` | `usePayrollHistoryExportMutation` |
| POST | `/v1/payroll/salaries/import` | yes | body: `organization_id`, `payroll_day_type`, `items` | `PayrollImportResp` | `importPayrollSalaries` | `usePayrollImportMutation` |
| POST | `/v1/payroll/salaries/update` | yes | body: `organization_id`, `payroll_day_type`, `items`, `delete_ids` | — | `updatePayrollSalaries` | `usePayrollUpdateMutation` |

`organization_id` comes from `AuthUser.organization.id`. `timezone` is the browser IANA zone. Queries stay disabled until both the token and organization id are present.

`period` is `day` \| `week` \| `month`. The Payroll chart dropdown is Daily / Weekly / Monthly and sends those values as `period`.

Recent payouts have no `page` in the contract, only `limit` (max 100). `usePayrollRecentPayoutsInfiniteQuery` requests `limit = page * 10` and keeps the new slice. `failedCount` is counted from loaded rows with status `failed`.

`GET /salaries/next` returns `total_payout`, `recipients`, `payment_date`, and `list` (`PayrollOperationItem`: name, address, symbol, network, amount, net_pay). An empty `list` maps to `null` so the page shows the create-payroll empty state.

`GET /salaries/history` is paginated (`page` / `pageSize`, max 100). `usePayrollHistoryInfiniteQuery` loads the next page on scroll. Each row maps `month` → title (`August Payroll`), `transactions` → paid count / transaction count, `recipients`, `total_payout`, and `execution_time`. The list contract has no status or failed count; status is `pending` when `transactions` is 0 and there are recipients, otherwise `paid`.

`GET /salaries/history/{execution_id}` returns the same summary plus `list` (`PayrollOperationExecutionItem`). Rows map `recipient` → address, `destination_symbol` / `destination_network` → payout preference, `amount` / `net_pay`, `status` (`completed` → `paid`), and `destination_tx_hash`. Failed count is counted from loaded `failed` rows. The item has no email field; that line is omitted when empty.

`GET /salaries/history/export` downloads the payroll history CSV. The Payroll History tab **Export CSV** button calls it with `organization_id` and the browser IANA `timezone`. Filename comes from `Content-Disposition`, falling back to `payroll-history.csv`.

`POST /salaries/import` saves a draft next payroll. Set Pay Date is `first_day`, `last_day`, or `day_of_month`. Picking a day in the Day of month dialog sends **1** as `first_day`, **31** as `last_day`, and 2–30 as `day_of_month` plus `payroll_day`. Each item sends `name`, `address`, `amount`, `network`, `symbol`, and optional `email` / `description`. Success returns `{ batch_id, count }` and invalidates the payroll query namespace.

`POST /salaries/update` saves edits to the current next payroll with the same pay-date mapping. Existing rows send their numeric `id`; newly added drawer rows omit `id`. Removed original ids go in `delete_ids`. Items send `name`, `address`, `amount`, `network`, `symbol`, and optional `email` (no `description`). Success invalidates the payroll query namespace.

### Expenses — `src/api/expense.ts`, `src/types/expense.ts`, `src/hooks/use-expense-api.ts`

| Method | Path | Auth | Query | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/v1/payroll/expenses/current` | yes | `organization_id`, `timezone` | `ExpenseCurrentStats` | `getExpenseCurrentStats` | `useExpenseCurrentStatsQuery` |
| GET | `/v1/payroll/expenses/total-payout` | yes | `organization_id`, `period`, `timezone` | `ExpenseTotalPayoutPoint[]` | `getExpenseTotalPayout` | `useExpenseTotalPayoutQuery` |
| GET | `/v1/payroll/expenses/recent` | yes | `organization_id`, `limit` | `ExpenseRecentPayout[]` | `getExpenseRecentPayouts` | `useExpenseRecentPayoutsInfiniteQuery` |
| GET | `/v1/payroll/expenses/open` | yes | `organization_id` | `ExpenseOpenList` | `getExpenseOpen` | `useExpenseOpenQuery` |
| GET | `/v1/payroll/expenses/open/requests/count` | yes | `organization_id` | `ExpenseOpenRequestsCount` | `getExpenseOpenRequestsCount` | `useExpenseOpenRequestsCountQuery` |
| GET | `/v1/payroll/expenses/open/requests` | yes | `organization_id` | `ExpenseOpenList` | `getExpenseOpenRequests` | `useExpenseOpenRequestsQuery` |
| GET | `/v1/payroll/expenses/history` | yes | `organization_id`, `page`, `pageSize`, `search?`, `start_time?`, `end_time?` | `ExpenseHistoryResp` | `getExpenseHistory` | `useExpenseHistoryInfiniteQuery` |
| GET | `/v1/payroll/expenses/history/export` | yes | `organization_id`, `search?`, `start_time?`, `end_time?` | CSV file | `exportExpenseHistory` | `useExpenseHistoryExportMutation` |
| POST | `/v1/payroll/expenses/import` | yes | body: `organization_id`, `title`, `items` | `ExpenseImportResp` | `importExpenses` | `useExpenseImportMutation` |

`organization_id` comes from `AuthUser.organization.id`. `timezone` is the browser IANA zone. Queries stay disabled until both the token and organization id are present.

`period` is `day` \| `week` \| `month`. The Expense chart dropdown is Daily / Weekly / Monthly and sends those values as `period`.

Current stats map `total_reimbursement` → Total expense, `processed_expenses` → Number of expensed, and `total_expenses` → Number of expenses. Change strings such as `+10%` become numbers; blank / `-` map to `null`.

Recent payouts have no `page` in the contract, only `limit` (max 100). `useExpenseRecentPayoutsInfiniteQuery` requests `limit = page * 10` and keeps the new slice. `failedCount` is counted from loaded rows with status `failed`. `completed` maps to `paid`.

`GET /expenses/open` returns `total_payout`, `total_count`, and `batches` (`list` of operation items). The Open expense table flattens every batch list. `volume` is the USD expense; `amount` / `symbol` / `network` are the payout. `status` `paying` / `processing` / `submitted` shows the Paying control; anything else is Pay Now. Description fills the Receipt column.

`GET /expenses/open/requests/count` is `{ count }` and drives the Request Payments tab badge (hidden when `count` is 0). `GET /expenses/open/requests` uses the same batch list shape as Open expense. The Request Payments table maps `purpose` → Request for, `description` → Description (a filename looks like a receipt; empty cells are `-`), and `amount` / `symbol` / `network` → Amount / Payout Preference. **Pay Now** uses the same `EXPENSE_PAY_NOW_PAYABLE` as Open expense. This tab does not show Import CSV / Add Expense.

`GET /expenses/history` is paginated (`page` / `pageSize`, max 100) and accepts `search` (name, address, or amount) plus `start_time` / `end_time` as Unix seconds. `useExpenseHistoryInfiniteQuery` loads the next page on scroll and sends the History tab search and last-30-days (or custom) range. A description that looks like a file name is shown as a receipt; otherwise it is plain text.

`GET /expenses/history/export` downloads the expense history CSV. The Expense History tab **Export CSV** button calls it with the same `organization_id`, `search`, `start_time`, and `end_time` as the list (no `page` / `pageSize`). Filename comes from `Content-Disposition`, falling back to `expense-history.csv`.

`POST /expenses/import` saves a draft open expense. **Add Expense** and **Import CSV** both open the Add Expense drawer first (CSV / Google Sheets is parsed locally, same as payroll); **Save** posts this route. Body is `organization_id`, `title` (≤ 100), and `items` (`name` ≤ 50, `address` ≤ 128, `amount`, `network` ≤ 32, `symbol` ≤ 32, optional `email` ≤ 100 / `purpose` ≤ 100 / `description` ≤ 5000). Empty optional fields are omitted. Success returns `{ batch_id, count }` and invalidates the expense query namespace.

### Bonuses — `src/api/bonus.ts`, `src/types/bonus.ts`, `src/hooks/use-bonus-api.ts`

| Method | Path | Auth | Query | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/v1/payroll/bonuses/current` | yes | `organization_id`, `timezone` | `BonusCurrentStats` | `getBonusCurrentStats` | `useBonusCurrentStatsQuery` |
| GET | `/v1/payroll/bonuses/total-payout` | yes | `organization_id`, `period`, `timezone` | `BonusTotalPayoutPoint[]` | `getBonusTotalPayout` | `useBonusTotalPayoutQuery` |
| GET | `/v1/payroll/bonuses/recent` | yes | `organization_id`, `limit` | `BonusRecentPayout[]` | `getBonusRecentPayouts` | `useBonusRecentPayoutsInfiniteQuery` |
| GET | `/v1/payroll/bonuses/open` | yes | `organization_id` | `BonusPendingList` | `getBonusOpen` | `useBonusOpenQuery` |
| GET | `/v1/payroll/bonuses/history` | yes | `organization_id`, `page`, `pageSize`, `start_time?`, `end_time?` | `BonusHistoryResp` | `getBonusHistory` | `useBonusHistoryInfiniteQuery` |
| GET | `/v1/payroll/bonuses/history/export` | yes | `organization_id`, `start_time?`, `end_time?` | CSV file | `exportBonusHistory` | `useBonusHistoryExportMutation` |
| POST | `/v1/payroll/bonuses/import` | yes | body: `organization_id`, `title`, `items` | `BonusImportResp` | `importBonuses` | `useBonusImportMutation` |

`organization_id` comes from `AuthUser.organization.id`. `timezone` is the browser IANA zone. Queries stay disabled until both the token and organization id are present. There is no `/open/requests` (or `/open/requests/count`).

`period` is `day` \| `week` \| `month`. The Bonus chart dropdown is Daily / Weekly / Monthly and sends those values as `period`.

Current stats map `total_bonus` → Total Bonus and `members` → Members. Change strings such as `+10%` become numbers; blank / `-` map to `null`.

Recent payouts have no `page` in the contract, only `limit` (max 100). `useBonusRecentPayoutsInfiniteQuery` requests `limit = page * 10` and keeps the new slice. `failedCount` is counted from loaded rows with status `failed`. `completed` maps to `paid`.

`GET /bonuses/open` returns `total_payout`, `total_count`, and `batches` (`title`, `volume`, `list` of operation items). The Bonuses to be paid table keeps each batch as a grouped row: one member shows the name and address, more than one expands. `volume` is the USD total; member `amount` / `symbol` are the payout. `status` `paying` / `processing` / `submitted` on any member shows Paying for that batch; anything else is Pay Now with that batch's `batch_id`. An empty batch list is the create-bonus empty state.

`GET /bonuses/history` is paginated (`page` / `pageSize`, max 100) and accepts `start_time` / `end_time` as Unix seconds. The Bonus History tab does not send those filters yet. `useBonusHistoryInfiniteQuery` loads the next page on scroll. Each execution item maps `name` (or `purpose`) → title, `destination_volume` → total payout, and `paid_at` → execution time.

`GET /bonuses/history/export` downloads the bonus history CSV. The Bonus History tab **Export CSV** button calls it with `organization_id` (and `start_time` / `end_time` when those filters are added). Filename comes from `Content-Disposition`, falling back to `bonus-history.csv`.

`POST /bonuses/import` saves a draft open bonus. **Add Bonus** and **Import CSV** both open the Add Bonus drawer first (CSV / Google Sheets is parsed locally, same as payroll); **Save** posts this route. Body is `organization_id`, `title` (≤ 100), and `items` (`name` ≤ 50, `address` ≤ 128, `amount`, `network` ≤ 32, `symbol` ≤ 32, optional `email` ≤ 100 / `purpose` ≤ 100 / `description` ≤ 5000). CSV columns are `recipient,email,amount,token,network,memo`; `memo` maps to `description`. Empty optional fields are omitted. Success returns `{ batch_id, count }` and invalidates the bonus query namespace.

### Payout (legacy wallet path) — `src/api/payout.ts`, `src/types/payout.ts`

| Method | Path | Auth | Body / Query | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/v1/payroll/single/quote` | caller | `PaySingleQuoteParam` | `PaySingleQuoteResp` | `singleQuote` | `useSinglePayQuote` |
| POST | `/v1/payroll/single/swap` | caller | `PaySingleSwapParam` | `PaySingleSwapResp` | `singleSwap` | `useSinglePaySwap` |
| POST | `/v1/payroll/single/submit` | caller | `PaySingleSubmitParam` | — | `singleSubmit` | via `quick-pay-commit-queue` |
| POST | `/v1/payroll/batch/quote` | yes | `PayBatchQuoteParam` | `PayBatchQuoteResp` | `batchQuote` | `useBatchPayQuote` |
| POST | `/v1/payroll/batch/swap` | yes | `PayBatchQuoteParam` | `PayBatchSwapResp` | `batchSwap` | `useBatchPaySwap` |
| POST | `/v1/payroll/batch/submit` | yes | `PayBatchSubmitParam` | — | `batchSubmit` | via `batch-payout-commit-queue` |
| GET | `/v1/payroll/payments/pending` | yes | — | `PayPaymentItem[]` | `getPendingPayments` | `usePendingPaymentsQuery` |
| GET | `/v1/payroll/payments/recent` | yes | — | `PayPaymentItem[]` | `getRecentPayments` | `useRecentPaymentsQuery` |
| GET | `/v1/payroll/payments` | yes | `PayPaymentsQuery` | `PayPaymentsResp` | `getPayments` | `usePaymentsQuery` |
| GET | `/v1/payroll/payments/export` | yes | `PayPaymentsExportQuery` | CSV blob | `exportPayments` | `useExportPaymentsMutation` |
| GET | `/v1/payroll/payments/volume` | yes | `period` | `VolumePoint[]` | `getPaymentVolume` | `usePaymentVolumeQuery` |
| GET | `/v1/payroll/overview` | yes | — | `PayOverview` | `getPayOverview` | `usePayOverviewQuery` |

`getPayOverview` falls back to the current month of `/v1/payroll/analytics` when the overview route answers 404. The quote hooks refetch every 60 seconds and keep the previous data while refetching, so treat `isPlaceholderData` as "stale quote, block the confirm button".

Both `submit` calls are driven by the persisted retry queues rather than a hook: `enqueueQuickPayCommit` / `enqueueBatchPayoutCommit` store `{ orderId, txHash }`, retry with exponential backoff from 5s, and drop the item once the server accepts it.

### Recipients — `src/api/recipient.ts`, `src/types/recipient.ts`, `src/hooks/use-recipient-api.ts`

| Method | Path | Auth | Body | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/v1/payroll/recipients` | yes | — | `PayRecipient[]` | `listRecipients` | `useRecipientsQuery` |
| POST | `/v1/payroll/recipients` | yes | `{ name, address, email? }` | `PayRecipient` | `createRecipient` | `useRecipientMutations` |
| POST | `/v1/payroll/recipients/{id}` | yes | `{ name, address, email? }` | `PayRecipient` | `updateRecipient` | `useRecipientMutations` |
| DELETE | `/v1/payroll/recipients/{id}` | yes | — | — | `deleteRecipient` | `useRecipientMutations` |

`useContacts` wraps these hooks. The UI `PayRecipient` still uses `wallet`; the mapper reads `address` (and `wallet` as a fallback) and writes `address`. Numeric `id` values are stored as strings. Empty `email` is omitted on POST. The GET list is a full array with no pagination. Single Payment uses this book for **employee** only; **admin** Recipients lists Team members instead (`useTeamMembersInfiniteQuery`).

### Payment requests — `src/api/request-payment.ts`, `src/types/request-payment.ts`, `src/hooks/use-request-payment.ts`

| Method | Path | Auth | Body | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/v1/payroll/request` | yes | `PayCreateRequestParam` | `PayCreateRequestResp` | `createPayRequest` | `useCreatePayRequestMutation` |
| GET | `/v1/payroll/request/{id}` | caller | — | `PayRequestItem` | `getPayRequest` | `usePayRequestDetailQuery` |
| GET | `/v1/payroll/request/list` | yes | — | `PayRequestItem[]` | `getRequestPayments` | `useRequestPaymentsQuery` |
| POST | `/v1/payroll/request/{id}/disable` | yes | — | — | `disablePayRequest` | `useDisablePayRequestMutation` |
| POST | `/v1/payroll/request/withdraw` | yes | `PayWithdrawParam` | — | `withdrawPayRequest` | `useRequestWithdraw` |
| GET | `/v1/payroll/request/withdraw/count` | yes | — | `number` | `getRequestWithdrawCount` | `useRequestWithdrawCountQuery` |

`getPayRequest` takes `{ auth }` so an anonymous payer can read a request; the page that needs it (`/p/:id`) is currently disabled. `createPayRequest` throws when the response has no positive `id`.

### Near Intents proxy — `src/api/nearintents.ts`, `src/types/nearintents.ts`

All four pass `envelope: false`. They are called from `src/lib/confidential/` for private receive and withdraw, not from a query hook.

| Method | Path | Auth | Body / Query | Data | API |
| --- | --- | --- | --- | --- | --- |
| POST | `/v1/nearintents/quote` | yes | `NearintentsQuoteParam` | `NearintentsQuoteResp` | `nearintentsQuote` |
| POST | `/v1/nearintents/generate-intent` | yes | `NearintentsGenerateIntentParam` | `NearintentsGenerateIntentResp` | `nearintentsGenerateIntent` |
| POST | `/v1/nearintents/submit-intent` | yes | `NearintentsSubmitIntentParam` | `NearintentsSubmitIntentResp` | `nearintentsSubmitIntent` |
| GET | `/v1/nearintents/status` | yes | `depositAddress`, `depositMemo` | `NearintentsStatusResp` | `nearintentsStatus` |

`nearintentsQuote` throws when the upstream answer has no `quote.depositAddress`.

### Out of scope

`src/api/analytics.ts` and `src/api/partner.ts` back the disabled Analytics and Partner areas. They are not documented here. Do not extend them without being asked.

## Files

| File | Role |
| --- | --- |
| `src/lib/http.ts` | `http`, `httpBlob`, `filenameFromContentDisposition` |
| `src/lib/api-error.ts` | `ApiError` |
| `src/lib/auth-session.ts` | Token storage, `getAuthToken`, `notifyUnauthorized` |
| `src/lib/query-client.ts` | `queryClient` (30s `staleTime`, 1 retry, no refetch on focus) |
| `src/api/config.ts` | `PAY_API_PREFIX`, `NEARINTENTS_API_PREFIX` |
| `src/api/query-keys.ts` | `queryKeys` factory |
| `src/api/payable.ts` | Payables list and salaries/expense/bonus pay |
| `src/api/map.ts` | `asRecord`, `apiText`, `apiNumber` |
| `src/api/payroll.ts` | Payroll salaries current / total-payout / recent / next / history |
| `src/api/expense.ts` | Expense current / total-payout / recent / open / open requests / history / history export / import |
| `src/api/bonus.ts` | Bonus current / total-payout / recent / open / history / history export / import |
