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

Pass `auth: false` for endpoints that must work signed out (login, register, reset password, invite organization preview).

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
    payrollPayment: (id: string) => [...queryKeys.payout.all, "payroll-payment", id] as const,
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
export function usePayrollPaymentQuery(paymentId: string) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.payout.payrollPayment(paymentId),
    queryFn: () => getPayrollPayment(paymentId),
    enabled: Boolean(token) && Boolean(paymentId),
  });
}
```

```tsx
const loginMutation = useLoginMutation();

const session = await loginMutation.mutateAsync({ email, password });  // writes the session
navigate(postAuthPath(session.user, returnTo));
```

## Endpoints

Paths are prefixed with `PAY_API_PREFIX` (`/v1/payroll`) or `NEARINTENTS_API_PREFIX` (`/v1/nearintents`) from `src/api/config.ts`. "Auth" is the default for that function; `no` means the call is signed out (login, register, invite preview).

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
| POST | `/v1/payroll/organizations/{id}` | yes | `UpdateOrganizationBody` (`name`, optional `logo`) | — | `updateOrganization` | `useUpdateOrganizationMutation` |
| POST | `/v1/payroll/organizations/{id}/address-settings` | yes | `UpdateAddressSettingsBody` (any of `near_address` / `solana_address` / `tron_address`) | — | `updateOrganizationAddressSettings` | `useUpdateAddressSettingsMutation` |
| POST | `/v1/payroll/organizations/{id}/notification-settings` | yes | `UpdateNotificationSettingsBody` (any of `slack` / `telegram`) | — | `updateOrganizationNotificationSettings` | `useUpdateNotificationSettingsMutation` |
| POST | `/v1/payroll/organizations/{id}/slack/connect` | yes | — | `SlackConnectResult` | `connectOrganizationSlack` | `useConnectSlackMutation` |
| POST | `/v1/payroll/organizations/{id}/slack/oauth` | yes | `SlackOAuthBody` (`code`, `state`) | `SlackOAuthResult` | `completeOrganizationSlackOAuth` | `useSlackOAuthMutation` |

Integer `organization_id` / path `{id}` come from session `user.organization.id` and are unchanged for overview, payout, high-priority, team, and settings mutations. Queries and mutations do not fire when that id is missing. `GET /organizations/{id}` also returns string `org_id`, `address_settings`, and `notification_settings` (`disabled` / `optional` / `required`; blank or unknown maps to `disabled`). The string `org_id` is written onto the session as `organization.orgId` and is the only id used for invite URLs, `GET .../info/{org_id}`, and `POST /auth/register/user`. Settings picks the GET row whose `id` matches, or the first row. Organization Save POSTs `name` and optional `logo` only; empty `logo` is omitted. Address and notification settings are saved per field: Integration POSTs only the changed key on `/address-settings` (`near_address` / `solana_address` / `tron_address`) or `/notification-settings` (`slack` / `telegram`). Email and EVM stay locked Required in the UI and are not POSTed. Turning Slack on calls `/slack/connect`, follows `authorization_url`, then `/setting/slack/callback` POSTs `/slack/oauth` and writes `slack: required`. Closing Slack or switching Required / Optional does not re-authorize. `period` is the existing `VOLUME_PERIOD` (`day` / `week` / `month`). `timezone` is `browserTimeZone()`. Payout `time` is an ISO timestamp; the mapper formats it to `MMM d` (Daily / Weekly) or `MMM` (Monthly) for the Payments chart. High-priority items are `{ category, title, description }`. `category` values are `payroll` / `payFailed` / `requests`; unknown values are dropped. Overview shows `title` as the row heading and `description` as the subtitle.

### Member overview — `src/api/overview.ts`, `src/types/overview.ts`, `src/hooks/use-employee-overview-api.ts`

| Method | Path | Auth | Query | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/v1/payroll/overview` | yes | `organization_id` | `MemberOverviewStats` | `getMemberOverview` | `useMemberOverviewQuery` |
| GET | `/v1/payroll/overview/payout` | yes | `organization_id`, `period`, `timezone` | `MemberOverviewPayoutPoint[]` | `getMemberOverviewPayout` | `useMemberOverviewPayoutQuery` |

This is the member dashboard at `/`. Stats pending/error blocks the page skeleton; payout does not. `period` is `day` / `week` / `month`. `timezone` is `browserTimeZone()`. `time` becomes the chart label. Empty series still draw a zero grid.

Open Requests and Recent Payments are payment-request queries, documented below.

### Transaction history — `src/api/history.ts`, `src/types/history.ts`, `src/hooks/use-history-api.ts`

| Method | Path | Auth | Body / Query | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/v1/payroll/organizations/history` | yes | `HistoryQuery` | `HistoryListResp` | `getHistory` | `useHistoryQuery` |
| GET | `/v1/payroll/organizations/history/export` | yes | `HistoryExportQuery` | CSV file | `exportHistory` | `useExportHistoryMutation` |
| GET | `/v1/payroll/history` | yes | `HistoryQuery` | `HistoryListResp` | `getHistory` | `useHistoryQuery` |
| GET | `/v1/payroll/history/export` | yes | `HistoryExportQuery` | CSV file | `exportHistory` | `useExportHistoryMutation` |

Admin (`role` other than `"user"`) calls `/organizations/history`. Members (`role === "user"`) call `/history`. Both send session `organization_id`. List query: `page`, `pageSize`, optional `q`, `status` (`created` / `processing` / `completed` / `failed` / `expired`), `source_network`, `source_symbol`, `destination_network`, `destination_symbol`, `start_time`, `end_time` (unix seconds). Empty / All filters are omitted. Export uses the same filters without pagination. Filename comes from `Content-Disposition`, falling back to `transaction-history.csv`. Rows map `payment_id`, `source_*` / `destination_*`, `payer` / `recipient`, `tx_hash` / `destination_tx_hash`, `status`, and `submitted_at` (or `created_at`).

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
| POST | `/v1/payroll/payouts/retry` | yes | `PayrollPayoutRetryParam` (`execution_item_id`, `organization_id`, `success_url`) | `PayrollPayment` | `retryPayrollPayout` | `useRetryPayrollPayoutMutation` |

`POST /payments` does not settle anything. The backend opens a hosted checkout session and answers with `pay_url`; `SinglePayoutView` sends the browser there, and the payer completes the transfer on the checkout. `createPayrollPayment` throws `ApiError(..., "NO_PAY_URL")` when the response has no link.

`POST /payouts/retry` is the Payroll History **Pay Again** path for a failed execution item. Body is `execution_item_id` (detail row `id`, posted as a number), session `organization_id`, and `success_url` `{origin}/pay/payroll/history/{executionId}`. The mapper reuses `mapPayrollPayment` and throws `NO_PAY_URL` when the link is missing. On success the drawer sends the browser to `pay_url` with `window.location.assign`. Checkout query params on return are ignored; the drawer opens from the path.

`memo` (≤ 200 characters) is accepted but is not in the Swagger contract. Optional `notification: { email?, slack? }` is sent from Single Payment when Notify Recipient is on; empty keys are omitted. The switch-off path omits `notification` entirely.

The checkout returns to the `success_url` we send (`{origin}/pay/result`) only after a successful payment, with `out_order_no` set to the Payroll `payment_id`. `PayoutResultView` reads it and calls `GET /payments/{payment_id}` once — there is no state left to poll for.

### Payment by form — `src/api/payable.ts`, `src/types/payable.ts`, `src/hooks/use-payable-api.ts`

| Method | Path | Auth | Body / Query | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/v1/payroll/payables` | yes | `organization_id`, `timezone` | `Payable[]` | `getPayables` | `usePayablesQuery` |
| POST | `/v1/payroll/salaries/pay/quote` | yes | `PayrollPayParam` | `PayrollBatch` | `payPayrollSalaries` | `usePayablePayQuery` |
| POST | `/v1/payroll/expenses/{batch_id}/pay/quote` | yes | `PayablePayBaseParam` | `PayrollBatch` | `payExpenseBatch` | `usePayablePayQuery` |
| POST | `/v1/payroll/bonuses/{batch_id}/pay/quote` | yes | `PayablePayBaseParam` | `PayrollBatch` | `payBonusBatch` | `usePayablePayQuery` |

`organization_id` is session `user.organization.id`. `timezone` is `browserTimeZone()`. Rows whose `type` is not `payroll` / `expense` / `bonus` are dropped. Payroll keys use `period_month`; expense and bonus keys use `batch_id`. `list[].email` is mapped when present.

The three quote routes return `{ quote_id, batch }` (`quote_id` is a sibling of `batch`). The mapper reads `quote_id` and `batch` through `mapPayrollBatch` and throws `ApiError(..., "NO_QUOTE_ID")` or `ApiError(..., "NO_BATCH_TX")` when either is missing. `PaymentByFormCard` posts quote as `usePayablePayQuery` (`staleTime: 0`, `gcTime: 0`, no placeholder); Send uses `markBatchConsumed` then `broadcastBatchPayout`, then `enqueueBatchPayoutCommit({ quoteId, txHash })`. Expired or consumed quotes refetch quote. Optional `notification` is `"all"` when every item is selected, otherwise a comma-separated list of `item_id`s (`"1,5"`). `adjustments` is `{ item_id, net_pay }[]` only for rows whose saved net pay differs from list `net_pay` (or `amount` when `net_pay` is missing) and is omitted when nothing changed. Both fields are part of the quote query key. `payablePayBody` copies a non-empty `notification` string and `adjustments` array onto all three quote bodies.

### Payroll salaries — `src/api/payroll.ts`, `src/types/payroll.ts`, `src/hooks/use-payroll-api.ts`

| Method | Path | Auth | Query | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/v1/payroll/salaries/current` | yes | `organization_id`, `timezone` | `PayrollCurrentStats` | `getPayrollCurrentStats` | `usePayrollCurrentStatsQuery` |
| GET | `/v1/payroll/salaries/total-payout` | yes | `organization_id`, `period`, `timezone` | `PayrollTotalPayoutPoint[]` | `getPayrollTotalPayout` | `usePayrollTotalPayoutQuery` |
| GET | `/v1/payroll/salaries/recent` | yes | `organization_id`, `limit` | `PayrollRecentPayout[]` | `getPayrollRecentPayouts` | `usePayrollRecentPayoutsInfiniteQuery` |
| GET | `/v1/payroll/salaries/next` | yes | `organization_id`, `timezone` | `PayrollNextRun \| null` | `getPayrollNext` | `usePayrollNextQuery` |
| GET | `/v1/payroll/salaries/history` | yes | `organization_id`, `page`, `pageSize`, `timezone` | `PayrollHistoryResp` | `getPayrollHistory` | `usePayrollHistoryInfiniteQuery` |
| GET | `/v1/payroll/salaries/history/{execution_id}` | yes | `organization_id`, `timezone` | `PayrollHistoryDetail` | `getPayrollHistoryDetail` | `usePayrollHistoryDetailQuery` |
| GET | `/v1/payroll/salaries/history/{execution_id}/export` | yes | `organization_id`, `timezone` | CSV file | `exportPayrollHistoryDetail` | `usePayrollHistoryDetailExportMutation` |
| GET | `/v1/payroll/salaries/history/export` | yes | `organization_id`, `timezone` | CSV file | `exportPayrollHistory` | `usePayrollHistoryExportMutation` |
| POST | `/v1/payroll/salaries/import` | yes | body: `organization_id`, `payroll_day_type`, `items` | `PayrollImportResp` | `importPayrollSalaries` | `usePayrollImportMutation` |
| POST | `/v1/payroll/salaries/update` | yes | body: `organization_id`, `payroll_day_type`, `items`, `delete_ids` | — | `updatePayrollSalaries` | `usePayrollUpdateMutation` |

`organization_id` comes from `AuthUser.organization.id`. `timezone` is the browser IANA zone. Queries stay disabled until both the token and organization id are present.

`period` is `day` \| `week` \| `month`. The Payroll chart dropdown is Daily / Weekly / Monthly and sends those values as `period`.

Recent payouts have no `page` in the contract, only `limit` (max 100). `usePayrollRecentPayoutsInfiniteQuery` requests `limit = page * 10` and keeps the new slice. `failedCount` is counted from loaded rows with status `failed`.

`GET /salaries/next` returns `total_payout`, `recipients`, `payment_date`, `payable`, and `list` (`PayrollOperationItem`: name, address, symbol, network, amount, net_pay). An empty `list` maps to `null` so the page shows the create-payroll empty state. `payable` is a boolean; explicit `false` disables Pay Now (button copy **Not payday yet**, click is a no-op). Missing `payable` maps to `true`.

`GET /salaries/history` is paginated (`page` / `pageSize`, max 100). `usePayrollHistoryInfiniteQuery` loads the next page on scroll. Each row maps `month` → title (`August Payroll`), `transactions` → paid count / transaction count, `recipients`, `total_payout`, and `execution_time`. The list contract has no status or failed count; status is `pending` when `transactions` is 0 and there are recipients, otherwise `paid`.

`GET /salaries/history/{execution_id}` returns the same summary plus `list` (`PayrollOperationExecutionItem`). Rows map `recipient` → address, `destination_symbol` / `destination_network` → payout preference, `amount` / `net_pay`, `status` (`completed` → `paid`), and `destination_tx_hash`. Failed count is counted from loaded `failed` rows. The item has no email field; that line is omitted when empty.

`GET /salaries/history/{execution_id}/export` downloads that run's CSV. The history detail drawer **Export CSV** button calls it with the same `organization_id` and browser IANA `timezone` as the detail query. Filename comes from `Content-Disposition`, falling back to `payroll-history-detail.csv`.

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

`GET /expenses/open` returns `total_payout`, `total_count`, and `batches` (`title`, `volume`, `count`, `list` of operation items). The Open expense table keeps each batch as a grouped row: one member shows the name, address, and payout preference; more than one expands. Batch `volume` is the header Amount; member `amount` / `symbol` / `network` are the payout. `status` `paying` / `processing` / `submitted` on any member shows Paying for that batch; anything else is Pay Now with that batch's `batch_id`.

`GET /expenses/open/requests/count` is `{ count }` and drives the Request Payments tab badge (hidden when `count` is 0). `GET /expenses/open/requests` uses the same batch list shape as Open expense. The Request Payments table flattens members to one person per row and maps `purpose` → Request for, `description` → Description (a filename looks like a receipt; empty cells are `-`), and `amount` / `symbol` / `network` → Amount / Payout Preference. **Pay Now** uses that row's `batch_id`. This tab does not show Import CSV / Add Expense.

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

### Payout submit and executions — `src/api/payout.ts`, `src/types/payout.ts`

| Method | Path | Auth | Body / Query | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/v1/payroll/payouts/submit` | yes | `PayBatchSubmitParam` (`quote_id`, `tx_hash`) | `PayrollPayoutSubmitResult` | `batchSubmit` | via `batch-payout-commit-queue` |
| POST | `/v1/payroll/payouts/retry` | yes | `PayrollPayoutRetryParam` | `PayrollPayment` | `retryPayrollPayout` | `useRetryPayrollPayoutMutation` |
| GET | `/v1/payroll/executions/{execution_id}` | yes | `organization_id` | `PayrollExecution` | `getPayrollExecution` | `usePayoutExecutionPoll` |

Payment by form signs and broadcasts the payable quote, then `enqueueBatchPayoutCommit` stores `{ quoteId, txHash, title, type }`. `useBatchPayoutCommitQueue` (mounted in `PayLayout`) retries `POST /payouts/submit` with exponential backoff from 5s and drops the item once the server accepts it. Submit returns `execution_id`. The layout then polls `GET /executions/{execution_id}` every 5s without blocking the pay form. Only the latest execution is polled. Progress is an `info` toast (`{processed} / {total}` plus View). Newly terminal list items toast `completed` / `failed` / `expired`. View goes to the matching history list and stops polling. `finished: true` keeps the progress toast 3s then closes it.

### Recipients — `src/api/recipient.ts`, `src/types/recipient.ts`, `src/hooks/use-recipient-api.ts`

| Method | Path | Auth | Body | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/v1/payroll/recipients` | yes | — | `PayRecipient[]` | `listRecipients` | `useRecipientsQuery` |
| POST | `/v1/payroll/recipients` | yes | `{ name, address, email? }` | `PayRecipient` | `createRecipient` | `useRecipientMutations` |
| POST | `/v1/payroll/recipients/{id}` | yes | `{ name, address, email? }` | `PayRecipient` | `updateRecipient` | `useRecipientMutations` |
| DELETE | `/v1/payroll/recipients/{id}` | yes | — | — | `deleteRecipient` | `useRecipientMutations` |

`useContacts` wraps these hooks. The UI `PayRecipient` still uses `wallet`; the mapper reads `address` (and `wallet` as a fallback) and writes `address`. Numeric `id` values are stored as strings. Empty `email` is omitted on POST. The GET list is a full array with no pagination. Single Payment uses this book for **employee** only; **admin** Recipients lists Team members instead (`useTeamMembersInfiniteQuery`).

### Payment requests — `src/api/request-payment.ts`, `src/types/request-payment.ts`, `src/hooks/use-request-payment.ts`

| Method | Path | Auth | Body / Query | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/v1/payroll/payment-requests` | yes | `CreatePaymentRequestParam` | `PaymentRequestItem` | `createPaymentRequest` | `useCreatePayRequestMutation` |
| GET | `/v1/payroll/payment-requests` | yes | `organization_id`, `page`, `pageSize`, `status?` | `PaymentRequestListResp` | `getPaymentRequests` | `usePaymentRequestsQuery` |
| GET | `/v1/payroll/payment-requests/pending` | yes | `organization_id`, `limit` | `MemberOpenRequest[]` | `getPendingPaymentRequests` | `usePendingPaymentRequestsQuery` |
| GET | `/v1/payroll/payment-requests/recent` | yes | `organization_id`, `limit` | `MemberRecentPayment[]` | `getRecentPaymentRequests` | `useRecentPaymentRequestsQuery` |
| GET | `/v1/payroll/payment-requests/default-addresses` | yes | `organization_id` | `PaymentRequestDefaultAddress[]` | `getPaymentRequestDefaultAddresses` | `usePaymentRequestDefaultAddressesQuery` |

`organization_id` comes from session `user.organization.id`. Queries and create do not fire when that id is missing. Empty `description` is omitted from POST. `set_default_address` is always sent. Create throws `ApiError(..., "PAY_REQUEST")` when `batch_id` is missing or ≤0.

Pending Open Requests use `limit` 6 and show `purpose` (fallback `title`). Recent Payments use `limit` 5: Type from `type` (`payout` → Payout, otherwise Income), Purpose from `memo`, amount/token from destination (fallback source), explorer from `destination_tx_hash` (fallback `tx_hash`). My Requests omits `status`, `pageSize` 10. Status `pending` / `created` / `processing` → Pending; `completed` → Complete; `failed` / `expired` → Failed. A receive `destination_tx_hash` / `tx_hash` shows an explorer link on Status.

Default addresses are `{ address, network }[]`. Request Payment prefers a matching default for the selected token chain over the connected wallet. **Save as default** is a form toggle sent as `set_default_address`.

### Near Intents proxy — `src/api/nearintents.ts`, `src/types/nearintents.ts`

All four pass `envelope: false`. They are called from `src/lib/confidential/` for private receive and withdraw, not from a query hook.

| Method | Path | Auth | Body / Query | Data | API |
| --- | --- | --- | --- | --- | --- |
| POST | `/v1/nearintents/quote` | yes | `NearintentsQuoteParam` | `NearintentsQuoteResp` | `nearintentsQuote` |
| POST | `/v1/nearintents/generate-intent` | yes | `NearintentsGenerateIntentParam` | `NearintentsGenerateIntentResp` | `nearintentsGenerateIntent` |
| POST | `/v1/nearintents/submit-intent` | yes | `NearintentsSubmitIntentParam` | `NearintentsSubmitIntentResp` | `nearintentsSubmitIntent` |
| GET | `/v1/nearintents/status` | yes | `depositAddress`, `depositMemo` | `NearintentsStatusResp` | `nearintentsStatus` |

`nearintentsQuote` throws when the upstream answer has no `quote.depositAddress`.

## Files

| File | Role |
| --- | --- |
| `src/lib/http.ts` | `http`, `httpBlob`, `filenameFromContentDisposition` |
| `src/lib/api-error.ts` | `ApiError` |
| `src/lib/auth-session.ts` | Token storage, `getAuthToken`, `notifyUnauthorized` |
| `src/lib/query-client.ts` | `queryClient` (30s `staleTime`, 1 retry, no refetch on focus) |
| `src/api/config.ts` | `PAY_API_PREFIX`, `NEARINTENTS_API_PREFIX` |
| `src/api/query-keys.ts` | `queryKeys` factory |
| `src/api/payable.ts` | Payables list and salaries/expense/bonus quote |
| `src/api/payout.ts` | Hosted checkout create/get, payout submit, executions, payroll-batch mapping |
| `src/api/map.ts` | `asRecord`, `apiText`, `apiNumber` |
| `src/api/overview.ts` | Member overview stats and payout chart |
| `src/api/request-payment.ts` | Payment requests create / list / pending / recent / default addresses |
| `src/api/payroll.ts` | Payroll salaries current / total-payout / recent / next / history |
| `src/api/expense.ts` | Expense current / total-payout / recent / open / open requests / history / history export / import |
| `src/api/bonus.ts` | Bonus current / total-payout / recent / open / history / history export / import |
