# API Layer

How to call the Stableflow Pay backend. Read this before adding or changing an endpoint.

The browser calls `VITE_API_BASE_URL` directly (no Vite proxy). Default: `https://test-api.stableflow.ai`. All product APIs live under `/v1/pay/` and are **GET**, **POST**, or **DELETE**.

## Layers

```
View / feature
  → src/hooks/use-<domain>-api.ts     TanStack Query (loading, error, cache)
    → src/api/<domain>.ts             thin http() wrappers
      → src/lib/http.ts               fetch + envelope + Bearer token
        → src/lib/auth-session.ts     localStorage { token, user }
          → src/stores/auth.ts        Zustand session
```

| Concern | Where | Do |
| --- | --- | --- |
| Request lifecycle (`isPending`, `error`, cache, refetch) | TanStack Query hooks | `useQuery` / `useMutation` |
| JWT session (`token`, `user`) | Zustand `useAuthStore` | `applySession` / `logout` |
| Other global UI state | Zustand (new store or existing) | Keep it small |
| Server lists, details, quotes | TanStack Query only | Do **not** copy into Zustand |

`http()` is the only function that may call `fetch` for `/v1/pay/*`. Do not add axios.

## Envelope

Every response is:

```ts
{ code: number; data?: T; message?: string }
```

`code === 200` unwraps and returns `data`. Any other `code`, non-OK HTTP status, or missing envelope throws `ApiError` (`src/lib/api-error.ts`: `message`, `status`, `code`).

## Auth header

`http()` sends `Authorization: Bearer {token}` **by default**.

- Pass `auth: false` only for public routes (login, register, reset password).
- If `auth` is true and no token is stored, `http()` throws `ApiError` 401 `UNAUTHENTICATED` without hitting the network.
- HTTP 401 on an authenticated request clears the stored session, notifies the auth store (`logout` + `queryClient.clear()`).

The auth store hydrates `{ token, user }` from `localStorage` on first import. `GET /v1/pay/profile` (`useProfileQuery`, mounted in `App`) then validates that token in the background. A 401 clears the session. Do not block navigation while the profile query is in flight.

## Adding an endpoint

1. Types → `src/types/<domain>.ts` (create the file if needed).
2. Request function → `src/api/<domain>.ts`. Call `http()` only. Prefix paths with `PAY_API_PREFIX` from `src/api/config.ts`.
3. Query key → `src/api/query-keys.ts` **only for `useQuery`**. Mutations do not get keys.
4. Hook → `src/hooks/use-<domain>-api.ts` (`useQuery` or `useMutation`).
5. Leave `auth` at the default unless the route is public.
6. Keep server data in Query. Persist only the session (or true global UI) in Zustand.
7. Append a row to the [endpoint table](#endpoints) below.

### Query keys

Add a namespace in `src/api/query-keys.ts` when you introduce a `useQuery`. Mutations do not get keys. Example:

```ts
order: {
  all: ["order"] as const,
  detail: (id: string | number) => [...queryKeys.order.all, "detail", id] as const,
},
```

Use `queryKeys.order.detail(id)` in `useQuery` and `queryClient.invalidateQueries({ queryKey: queryKeys.order.all })` after mutations that change that data.

### `http()` options

```ts
http<T>(path, {
  method?: "GET" | "POST" | "DELETE"; // default GET
  body?: unknown;          // JSON body (POST)
  query?: Record<string, string | number | boolean | null | undefined>;
  auth?: boolean;          // default true
})
```

GET query params go in `query` (nullish values are skipped). Path params are interpolated by the caller: `` `${PAY_API_PREFIX}/order/${id}` ``.

### View usage

```ts
import { useLoginMutation } from "@/hooks/use-auth-api";

function LoginForm() {
  const loginMutation = useLoginMutation();

  async function onSubmit(email: string, password: string) {
    try {
      await loginMutation.mutateAsync({ email, password });
      // Session is already in the auth store (hook onSuccess → applySession).
      navigate("/", { replace: true });
    } catch {
      // Read loginMutation.error (ApiError) for the message.
    }
  }
}
```

```ts
import { useAuthStore } from "@/stores/auth";

const user = useAuthStore((state) => state.user);
const logout = useAuthStore((state) => state.logout);
```

Authenticated query example (subsequent agents):

```ts
export function useOrderQuery(id: string) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.order.detail(id),
    queryFn: () => getOrder(id),
    enabled: Boolean(token) && Boolean(id),
  });
}
```

## Endpoints

| Method | Path | Auth | Body | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/v1/pay/auth/login` | no | `LoginBody` | `AuthSession` | `login` | `useLoginMutation` |
| POST | `/v1/pay/auth/register` | no | `RegisterBody` | `AuthSession` | `register` | `useRegisterMutation` |
| POST | `/v1/pay/change-password` | yes | `ChangePasswordBody` | `void` | `changePassword` | `useChangePasswordMutation` |
| POST | `/v1/pay/reset-password` | no | `ResetPasswordBody` | `void` | `resetPassword` | `useResetPasswordMutation` |
| POST | `/v1/pay/reset-password/code` | no | `ResetPasswordCodeBody` | `void` | `sendResetPasswordCode` | `useSendResetPasswordCodeMutation` |
| GET | `/v1/pay/profile` | yes | — | `AuthUser` | `getProfile` | `useProfileQuery` |
| POST | `/v1/pay/single/quote` | yes | `PaySingleQuoteParam` | `PaySingleQuoteResp` | `singleQuote` | `useSinglePayQuote` |
| POST | `/v1/pay/single/swap` | yes | `PaySingleSwapParam` | `PaySingleSwapResp` | `singleSwap` | `useSinglePaySwap` |
| POST | `/v1/pay/single/submit` | yes | `PaySingleSubmitParam` | `void` | `singleSubmit` | commit queue |
| POST | `/v1/pay/batch/quote` | yes | `PayBatchQuoteParam` | `PayBatchQuoteResp` | `batchQuote` | `useBatchPayQuote` |
| POST | `/v1/pay/batch/swap` | yes | `PayBatchQuoteParam` | `PayBatchSwapResp` | `batchSwap` | `useBatchPaySwap` |
| POST | `/v1/pay/batch/submit` | yes | `PayBatchSubmitParam` | `void` | `batchSubmit` | commit queue |
| GET | `/v1/pay/payments/pending` | yes | — | `PayPaymentItem[]` | `getPendingPayments` | `usePendingPaymentsQuery` |
| GET | `/v1/pay/payments/recent` | yes | — | `PayPaymentItem[]` | `getRecentPayments` | `useRecentPaymentsQuery` |
| GET | `/v1/pay/payments/volume` | yes | `period` | `VolumePoint[]` | `getPaymentVolume` | `usePaymentVolumeQuery` |
| GET | `/v1/pay/payments` | yes | `page`, `pageSize`, `q`, `status`, `token`, `start_time`, `end_time` | `PayPaymentsResp` | `getPayments` | `usePaymentsQuery` |
| GET | `/v1/pay/overview` | yes | — | `PayOverview` | `getPayOverview` | `usePayOverviewQuery` (404 falls back to current-month analytics stats) |
| GET | `/v1/pay/analytics` | yes | `month` | `PayAnalyticsResp` | `getPayAnalytics` | `useAnalyticsQuery` |
| GET | `/v1/pay/recipient/list` | yes | — | `PayRecipient[]` | `listRecipients` | `useRecipientsQuery` |
| POST | `/v1/pay/recipient` | yes | `PayRecipientBody` | `PayRecipient` | `createRecipient` | `useRecipientMutations` |
| POST | `/v1/pay/recipient/{id}` | yes | `PayRecipientBody` | `PayRecipient` | `updateRecipient` | `useRecipientMutations` |
| DELETE | `/v1/pay/recipient/{id}` | yes | — | `void` | `deleteRecipient` | `useRecipientMutations` |

Types: `src/types/auth.ts` (`AuthUser`, `LoginBody`, `RegisterBody`, `AuthSession`, `ChangePasswordBody`, `ResetPasswordBody`, `ResetPasswordCodeBody`). Payout types: `src/types/payout.ts`. Analytics: `src/types/analytics.ts`. Recipients: `src/types/recipient.ts`. Single and batch quote bodies use 1Click `network` codes (`eth`, `arb`, `sol`, …) plus `token` (`USDT` / `USDC`), not 1Click `assetId`. Single `memo` and `notifyEmail` belong on `PaySingleSwapParam` only, not on quote. Batch `receives` use `address` (wallet, no `employeeId`). Payment list rows are snake_case (`submitted_at`, `destination_*`); mappers produce `PayPaymentItem`. Amount/Asset use destination fields. History `start_time` / `end_time` are unix seconds (start of first day, end of last day). Volume `period` is `day` / `week` / `month`; points may use `start_at` + `total_payment` instead of `label` / `value`. Request Payment and non-EVM origin broadcast are not wired. Origin token pickers are limited by `payerEnabled` on `FIXED_CHAINS`.

Public files:

| Path | Role |
| --- | --- |
| `src/lib/http.ts` | `fetch` wrapper |
| `src/lib/http.test.ts` | Envelope, Bearer, 401 |
| `src/lib/api-error.ts` | `ApiError` |
| `src/lib/auth-session.ts` | `localStorage` session + 401 callback |
| `src/lib/query-client.ts` | Shared `QueryClient` |
| `src/api/config.ts` | `PAY_API_PREFIX` |
| `src/api/query-keys.ts` | Query key factory |
| `src/api/auth.ts` | Login, register, profile, change / reset password |
| `src/api/payout.ts` | Single and batch quote / swap / submit; overview, volume, pending, recent, payments |
| `src/api/analytics.ts` | Analytics month query |
| `src/api/recipient.ts` | Address book list / create / update / delete |
| `src/hooks/use-auth-api.ts` | Auth mutations + profile query |
| `src/hooks/use-single-payout-api.ts` | Single quote query + swap mutation |
| `src/hooks/use-batch-payout-api.ts` | Batch quote query + swap mutation |
| `src/hooks/use-payout-api.ts` | Overview, volume, recent, payments queries |
| `src/hooks/use-pending-payments.ts` | Pending payouts query |
| `src/hooks/use-analytics-api.ts` | Analytics month query |
| `src/hooks/use-recipient-api.ts` | Recipient list + mutations |
| `src/stores/auth.ts` | Session store |
| `src/types/auth.ts` | Auth types |
| `src/types/payout.ts` | Quick, batch, overview, volume, and payment list types |
| `src/types/analytics.ts` | Analytics response types |
| `src/types/recipient.ts` | Address book types |
