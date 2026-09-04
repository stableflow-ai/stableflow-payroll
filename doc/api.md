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

await loginMutation.mutateAsync({ email, password });  // writes the session
navigate(returnTo ?? "/", { replace: true });
```

## Endpoints

Paths are prefixed with `PAY_API_PREFIX` (`/v1/payroll`) or `NEARINTENTS_API_PREFIX` (`/v1/nearintents`) from `src/api/config.ts`. "Auth" is the default for that function; `caller` means the caller decides.

Only Auth, Single Payout (`/payments`), and Batch Payout (`/batches`) are served by the Payroll backend. The Payout, Recipients, and Payment-request tables are the pre-Payroll contract kept unchanged under the new prefix; the screens that call them are not in scope yet, so those routes will 404. Do not treat them as a spec.

### Auth — `src/api/auth.ts`, `src/types/auth.ts`, `src/hooks/use-auth-api.ts`

| Method | Path | Auth | Body | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/v1/payroll/auth/login` | no | `LoginBody` | `AuthSession` | `login` | `useLoginMutation` |
| POST | `/v1/payroll/auth/register` | no | `RegisterBody` | `AuthSession` | `register` | `useRegisterMutation` |
| POST | `/v1/payroll/change-password` | yes | `ChangePasswordBody` | — | `changePassword` | `useChangePasswordMutation` |
| POST | `/v1/payroll/reset-password/code` | no | `ResetPasswordCodeBody` | — | `sendResetPasswordCode` | `useSendResetPasswordCodeMutation` |
| POST | `/v1/payroll/reset-password` | no | `ResetPasswordBody` | — | `resetPassword` | `useResetPasswordMutation` |
| GET | `/v1/payroll/profile` | yes | — | `AuthUser` | `getProfile` | `useProfileQuery` |
| POST | `/v1/payroll/profile` | yes | `UpdateProfileBody` | — | `updateProfile` | `useUpdateProfileMutation` |

`AuthUser` includes `role`: `"admin"` | `"employee"`. Login, register, and profile are typed as already returning that field (`http<AuthSession>` / `http<AuthUser>`). Do not remap it until the backend uses a different name. Stored sessions without `role` hydrate as admin.

### Payments (hosted checkout) — `src/api/payout.ts`, `src/types/payout.ts`, `src/hooks/use-single-payout-api.ts`

| Method | Path | Auth | Body | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/v1/payroll/payments` | yes | `PayrollCreatePaymentParam` | `PayrollPayment` | `createPayrollPayment` | `useCreatePayrollPaymentMutation` |
| GET | `/v1/payroll/payments/{payment_id}` | yes | — | `PayrollPayment` | `getPayrollPayment` | `usePayrollPaymentQuery` |

`POST /payments` does not settle anything. The backend opens a hosted checkout session and answers with `pay_url`; `SinglePayoutView` sends the browser there, and the payer completes the transfer on the checkout. `createPayrollPayment` throws `ApiError(..., "NO_PAY_URL")` when the response has no link.

`memo` (≤ 200 characters) is accepted but is not in the Swagger contract. There is no `notifyEmail` parameter.

The checkout returns to the `success_url` we send (`{origin}/pay/result`) only after a successful payment, with `out_order_no` set to the Payroll `payment_id`. `PayoutResultView` reads it and calls `GET /payments/{payment_id}` once — there is no state left to poll for.

### Batch payout — `src/api/payout.ts`, `src/types/payout.ts`, `src/hooks/use-batch-payout-api.ts`

| Method | Path | Auth | Body | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/v1/payroll/batches` | yes | `PayrollCreateBatchParam` | `PayrollBatch` | `createPayrollBatch` | `useCreatePayrollBatchQuery` |
| GET | `/v1/payroll/batches/{batch_id}/transaction` | yes | — | `PayrollBatch` | `getPayrollBatchTransaction` | `usePayrollBatchTransactionQuery` |

`POST /batches` creates the batch and answers with the origin quote (`total_source_amount` / `total_source_amount_raw`) plus the origin-chain `transaction` to sign. `BatchPayoutView` posts once when preview opens; the refresh control and an expired/spent quote call `refetch()`. `createPayrollBatch` throws `ApiError(..., "NO_BATCH_TX")` when the response has no broadcastable transaction.

Confirm signs and broadcasts that transaction. There is no submit call after broadcast. `GET .../transaction` is a status lookup; the page does not call it (success resets to the upload step). A consumed `batchId` is stored in `consumed-batches` before broadcast so the same deposit addresses are never paid twice.

`notification.email` / `notification.slack` are omitted: the page does not collect them.

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
| GET | `/v1/payroll/recipient/list` | yes | — | `PayRecipient[]` | `listRecipients` | `useRecipientsQuery` |
| POST | `/v1/payroll/recipient` | yes | `PayRecipientBody` | `PayRecipient` | `createRecipient` | `useRecipientMutations` |
| POST | `/v1/payroll/recipient/{id}` | yes | `PayRecipientBody` | `PayRecipient` | `updateRecipient` | `useRecipientMutations` |
| DELETE | `/v1/payroll/recipient/{id}` | yes | — | — | `deleteRecipient` | `useRecipientMutations` |

`useContacts` wraps these hooks and is what the Pay views use.

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
| `src/api/map.ts` | `asRecord`, `apiText`, `apiNumber` |
