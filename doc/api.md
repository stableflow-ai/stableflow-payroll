# API Layer

How to call the Stableflow Pay backend. Read this before adding or changing an endpoint.

The browser calls `VITE_API_BASE_URL` directly (no Vite proxy). Default: `https://test-api.stableflow.ai`. All product APIs live under `/v1/pay/` and are **GET** or **POST**.

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

- Pass `auth: false` only for public routes (login, register).
- If `auth` is true and no token is stored, `http()` throws `ApiError` 401 `UNAUTHENTICATED` without hitting the network.
- HTTP 401 on an authenticated request clears the stored session, notifies the auth store (`logout` + `queryClient.clear()`).

There is no `GET /auth/me` yet. The auth store hydrates `{ token, user }` from `localStorage` on first import. When `/auth/me` exists, validate the stored token on boot instead of trusting localStorage alone.

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
  method?: "GET" | "POST"; // default GET
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
| POST | `/v1/pay/quick/quote` | yes | `PayQuickQuoteParam` | `PayQuickQuoteResp` | `quickQuote` | `useQuickPayQuote` |
| POST | `/v1/pay/quick/swap` | yes | `PayQuickQuoteParam` | `PayQuickSwapResp` | `quickSwap` | `useQuickPaySwap` |
| POST | `/v1/pay/quick/submit` | yes | `PayQuickSubmitParam` | `void` | `quickSubmit` | commit queue |
| POST | `/v1/pay/batch/quote` | yes | `PayBatchQuoteParam` | `PayBatchQuoteResp` | `batchQuote` | `useBatchPayQuote` |
| POST | `/v1/pay/batch/swap` | yes | `PayBatchQuoteParam` | `PayBatchSwapResp` | `batchSwap` | `useBatchPaySwap` |
| POST | `/v1/pay/batch/submit` | yes | `PayBatchSubmitParam` | `void` | `batchSubmit` | commit queue |
| GET | `/v1/pay/payments/pending` | yes | — | `PayPending[]` | `getPendingPayments` | `usePendingPaymentsQuery` |

Types: `src/types/auth.ts` (`AuthUser`, `LoginBody`, `RegisterBody`, `AuthSession`). Payout types: `src/types/payout.ts`. `PayQuickQuoteParam.notification` is an optional email string; omit the field when notify is off. Batch receives are wallet addresses (no `employeeId`). `GET /v1/pay/payments/pending` unwraps either `PayPending[]` or `{ payments: PayPending[] }`.

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
| `src/api/auth.ts` | Login / register |
| `src/api/payout.ts` | Quick and batch quote / swap / submit; pending list |
| `src/hooks/use-auth-api.ts` | Auth mutations |
| `src/hooks/use-single-payout-api.ts` | Quick quote query + swap mutation |
| `src/hooks/use-batch-payout-api.ts` | Batch quote query + swap mutation |
| `src/hooks/use-pending-payments.ts` | Pending payouts query |
| `src/stores/auth.ts` | Session store |
| `src/types/auth.ts` | Auth types |
| `src/types/payout.ts` | Quick and batch payout types |
