# API Layer

How to call the Stableflow Pay backend. Read this before adding or changing an endpoint.

The browser calls `VITE_API_BASE_URL` directly (no Vite proxy). Default: `https://test-api.stableflow.ai`. Product APIs live under `/v1/pay/` and `/v1/nearintents/` and are **GET**, **POST**, or **DELETE**.

## Layers

```
View / feature
  → src/hooks/use-<domain>-api.ts     TanStack Query (loading, error, cache)
    → src/api/<domain>.ts             thin http() / httpBlob() wrappers
      → src/lib/http.ts               fetch + envelope + Bearer token + file downloads
        → src/lib/auth-session.ts     localStorage { token, user }
          → src/stores/auth.ts        Zustand session
```

| Concern | Where | Do |
| --- | --- | --- |
| Request lifecycle (`isPending`, `error`, cache, refetch) | TanStack Query hooks | `useQuery` / `useMutation` |
| JWT session (`token`, `user`) | Zustand `useAuthStore` | `applySession` / `logout` |
| Other global UI state | Zustand (new store or existing) | Keep it small |
| Server lists, details, quotes | TanStack Query only | Do **not** copy into Zustand |

`http()` and `httpBlob()` in `src/lib/http.ts` are the only functions that may call `fetch` for `/v1/pay/*` and `/v1/nearintents/*`. Do not add axios. `/v1/nearintents/*` uses `envelope: false` because the backend proxies 1Click JSON (no `{ code, data }` wrapper). 1Click `/v0/auth/*` and `/v0/account/balances` are a different host (no product envelope) and stay in `src/lib/confidential/one-click-auth.ts`. File downloads (CSV export) use `httpBlob()`, which returns `{ blob, filename }` instead of unwrapping `{ code, data }`.

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
2. Request function → `src/api/<domain>.ts`. Call `http()` (or `httpBlob()` for file downloads) only. Prefix paths with `PAY_API_PREFIX` from `src/api/config.ts`.
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
  envelope?: boolean;      // default true; false for `/v1/nearintents/*` 1Click passthrough
})
```

GET query params go in `query` (nullish values are skipped). Path params are interpolated by the caller: `` `${PAY_API_PREFIX}/order/${id}` ``.

File downloads:

```ts
httpBlob(path, {
  method?: "GET" | "POST" | "DELETE";
  query?: Record<string, string | number | boolean | null | undefined>;
  auth?: boolean;              // default true
  fallbackFilename?: string;   // used when Content-Disposition has no filename
})
```

Success returns `{ blob, filename }`. `filename` comes from `Content-Disposition` (`filename` or `filename*`). HTTP errors and `{ code }` envelopes that are not `200` throw `ApiError` the same way as `http()`.

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
| GET | `/v1/pay/payments/export` | yes | `q`, `status`, `token`, `start_time`, `end_time` | CSV blob | `exportPayments` | `useExportPaymentsMutation` |
| GET | `/v1/pay/overview` | yes | — | `PayOverview` | `getPayOverview` | `usePayOverviewQuery` (404 falls back to current-month analytics stats) |
| GET | `/v1/pay/analytics` | yes | `month` | `PayAnalyticsResp` | `getPayAnalytics` | `useAnalyticsQuery` |
| GET | `/v1/pay/recipient/list` | yes | — | `PayRecipient[]` | `listRecipients` | `useRecipientsQuery` |
| POST | `/v1/pay/recipient` | yes | `PayRecipientBody` | `PayRecipient` | `createRecipient` | `useRecipientMutations` |
| POST | `/v1/pay/recipient/{id}` | yes | `PayRecipientBody` | `PayRecipient` | `updateRecipient` | `useRecipientMutations` |
| DELETE | `/v1/pay/recipient/{id}` | yes | — | `void` | `deleteRecipient` | `useRecipientMutations` |
| GET | `/v1/pay/partner` | yes | — | `PayPartner \| null` | `getPartner` | `usePartnerQuery` (null/empty data = not a Partner) |
| POST | `/v1/pay/partner` | yes | `PayCreatePartnerBody` | `PayCreatePartnerResp` | `createPartner` | `useCreatePartnerMutation` |
| GET | `/v1/pay/partner/keys` | yes | — | `PayPartnerKey[]` | `listPartnerKeys` | `usePartnerKeysQuery` |
| POST | `/v1/pay/partner/keys` | yes | `PayPartnerKeyLabelBody` | `PayPartnerKey` | `createPartnerKey` | `usePartnerKeyMutations` |
| POST | `/v1/pay/partner/keys/{id}` | yes | `PayPartnerKeyLabelBody` | `void` | `updatePartnerKeyLabel` | `usePartnerKeyMutations` |
| DELETE | `/v1/pay/partner/keys/{id}` | yes | — | `void` | `deletePartnerKey` | `usePartnerKeyMutations` |
| GET | `/v1/pay/partner/analytics` | yes | `start_time`, `end_time`, `api_key_id`, `network` | `PayPartnerAnalyticsResp` | `getPartnerAnalytics` | `usePartnerAnalyticsQuery` |
| GET | `/v1/pay/partner/payments` | yes | `page`, `pageSize`, `api_key_id`, `network`, `token`, `destination_network`, `destination_token`, `min_amount`, `max_amount` | `PayPartnerPaymentsResp` | `getPartnerPayments` | `usePartnerPaymentsQuery` |
| POST | `/v1/pay/request` | yes | `PayCreateRequestParam` | `PayCreateRequestResp` | `createPayRequest` | `useCreatePayRequestMutation` |
| GET | `/v1/pay/request/{id}` | if session | — | `PayRequestItem` | `getPayRequest` | `usePayRequestDetailQuery` |
| GET | `/v1/pay/request/list` | yes | — | `PayRequestItem[]` | `getRequestPayments` | `useRequestPaymentsQuery` |
| POST | `/v1/pay/request/{id}/disable` | yes | — | `void` | `disablePayRequest` | `useDisablePayRequestMutation` |
| POST | `/v1/pay/request/withdraw` | yes | `PayWithdrawParam` | `void` | `withdrawPayRequest` | `useRequestWithdraw` |
| GET | `/v1/pay/request/withdraw/count` | yes | — | `{ count: number }` | `getRequestWithdrawCount` | `useRequestWithdrawCountQuery` |
| POST | `/v1/nearintents/quote` | yes | `NearintentsQuoteParam` | `NearintentsQuoteResp` | `nearintentsQuote` | `useRequestWithdraw` |
| POST | `/v1/nearintents/generate-intent` | yes | `NearintentsGenerateIntentParam` | `NearintentsGenerateIntentResp` | `nearintentsGenerateIntent` | `useRequestWithdraw` |
| POST | `/v1/nearintents/submit-intent` | yes | `NearintentsSubmitIntentParam` | `NearintentsSubmitIntentResp` | `nearintentsSubmitIntent` | unused by product withdraw |
| GET | `/v1/nearintents/status` | yes | `depositAddress` | `NearintentsStatusResp` | `nearintentsStatus` | unused by product withdraw |

Types: `src/types/auth.ts` (`AuthUser`, `LoginBody`, `RegisterBody`, `AuthSession`, `ChangePasswordBody`, `ResetPasswordBody`, `ResetPasswordCodeBody`). Payout types: `src/types/payout.ts`. Analytics: `src/types/analytics.ts`. Recipients: `src/types/recipient.ts`. Partner: `src/types/partner.ts`. Request Payment: `src/types/request-payment.ts`. Near Intents proxy: `src/types/nearintents.ts`. Single and batch quote bodies use 1Click `network` codes (`eth`, `arb`, `sol`, …) plus `token` (`PAYOUT_SYMBOLS`), not 1Click `assetId`. Near-chain `NEAR` still sends symbol `NEAR`; the matching 1Click asset is `nep141:wrap.near` (`wNEAR`, 1:1 with native NEAR). `PaySingleSwapResp` includes `depositAddress` and `orderId` (no `callData`, no `depositMemo`). `PayBatchSwapResp` nests broadcast fields in `transaction` (`approvals` may be `null`, `callData`, `batch_contract` as both payout `to` and ERC-20 spender; Near adds `receiverId` + `actions`; Solana adds `serializedTransaction` + `lastValidBlockHeight`). Single `memo` and `notifyEmail` belong on swap (and are optional on the shared quote type). Request Payment create sends required `name` (max 50) and optional `memo`. List/detail rows also map `payer`, `paid_at`, `destination_tx_hash`, and `withdraw_tx_hash`. The public payer page at `/p/:id` calls `GET /v1/pay/request/{id}` and `POST /v1/pay/single/quote|swap|submit` with Bearer only when a session token exists; Single Payout still always sends auth. Request quotes add `request_id` only. `GET /v1/pay/request/{id}` includes `memo` and `name`. Pending requests can be disabled with `POST /v1/pay/request/{id}/disable`. Batch `receives` use `address` (wallet, no `employeeId`). Payment list rows are snake_case (`submitted_at`, `destination_*`); mappers produce `PayPaymentItem`. Amount/Asset use destination fields. History `start_time` / `end_time` are unix seconds (start of first day, end of last day). History export uses the same filters (no pagination) via `GET /v1/pay/payments/export` (`httpBlob`); the saved filename appends a local `yyyyMMdd-HHmmss` stamp. Volume `period` is `day` / `week` / `month`; points may use `start_at` + `total_payment` instead of `label` / `value`. Origin token pickers for Single / Request Payment are limited by `payerEnabled` on `FIXED_CHAINS`. Batch origin is limited by `batchEnabled` (all registered chains, including native). `/v1/nearintents/*` is our Partner-key proxy of 1Click `/v0`. Withdraw signs via generate-intent then `POST /v1/pay/request/withdraw`. The Pay sidebar polls `GET /v1/pay/request/withdraw/count` every 120s for the Request Payment badge. `GET /v1/pay/partner` returns `null` when the user is not a Partner. Registration posts Additional Details as `description`. Partner API key labels are max 200 characters. Partner reports stats use `GET /v1/pay/partner/analytics` (`start_time` / `end_time` unix seconds, optional `api_key_id` / `network`). The usage table uses `GET /v1/pay/partner/payments` (paginated; table filters only — no date range). Amount filters map to `min_amount` / `max_amount`. Time column is `submitted_at`. From is `payer`.

Public files:

| Path | Role |
| --- | --- |
| `src/lib/http.ts` | `fetch` wrapper (`http`, `httpBlob`) |
| `src/lib/http.test.ts` | Envelope, Bearer, 401, CSV blob |
| `src/lib/api-error.ts` | `ApiError` |
| `src/lib/auth-session.ts` | `localStorage` session + 401 callback |
| `src/lib/query-client.ts` | Shared `QueryClient` |
| `src/api/config.ts` | `PAY_API_PREFIX`, `NEARINTENTS_API_PREFIX` |
| `src/api/query-keys.ts` | Query key factory |
| `src/api/auth.ts` | Login, register, profile, change / reset password |
| `src/api/payout.ts` | Single and batch quote / swap / submit; overview, volume, pending, recent, payments, export |
| `src/api/analytics.ts` | Analytics month query |
| `src/api/recipient.ts` | Address book list / create / update / delete |
| `src/api/partner.ts` | Partner registration, API keys, reports analytics and payments |
| `src/api/nearintents.ts` | 1Click proxy: quote, generate-intent, submit-intent, status |
| `src/api/request-payment.ts` | Create request, request detail, received list, disable, withdraw, withdraw count |
| `src/hooks/use-auth-api.ts` | Auth mutations + profile query |
| `src/hooks/use-single-payout-api.ts` | Single quote query + swap mutation |
| `src/hooks/use-batch-payout-api.ts` | Batch quote query + swap mutation |
| `src/hooks/use-payout-api.ts` | Overview, volume, recent, payments queries; export mutation |
| `src/hooks/use-pending-payments.ts` | Pending payouts query |
| `src/hooks/use-analytics-api.ts` | Analytics month query |
| `src/hooks/use-recipient-api.ts` | Recipient list + mutations |
| `src/hooks/use-partner-api.ts` | Partner query, keys query, create partner, key mutations |
| `src/hooks/use-partner-reports.ts` | Partner reports analytics + payments queries |
| `src/hooks/use-request-payment.ts` | Received list query, withdraw count query, create/disable mutations, payer detail query |
| `src/hooks/use-request-withdraw.ts` | Confidential withdraw mutation |
| `src/stores/auth.ts` | Product JWT session store |
| `src/stores/nearintents-user-session.ts` | 1Click / Near Intents User-Session (not the product JWT) |
| `src/types/auth.ts` | Auth types |
| `src/types/payout.ts` | Quick, batch, overview, volume, payment list, and export types |
| `src/types/analytics.ts` | Analytics response types |
| `src/types/recipient.ts` | Address book types |
| `src/types/partner.ts` | Partner profile, API key, reports analytics and payments types |
| `src/types/request-payment.ts` | Create / detail / list / withdraw / withdraw-count types |
| `src/types/nearintents.ts` | `/v1/nearintents` quote / generate-intent / submit / status |
