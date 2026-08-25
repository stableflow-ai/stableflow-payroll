# Mock Data

Use this layer when a page must ship UI before the backend contract exists. When the contract is ready, follow [api.md](api.md) instead of adding a mock.

## When to use a mock

- The product screen is being built and `/v1/pay/*` for that domain is not stable yet.
- You need fixtures that match Figma (including `null` empty states).

Do **not** add a mock if the endpoint already exists. Call `http()` through `src/api/<domain>.ts` and a TanStack Query hook.

## Layout

| Path | Role |
| --- | --- |
| `src/mocks/config.ts` | `MOCK_ENABLED` flags, one key per domain |
| `src/mocks/<domain>.ts` | Local types, fixtures, and a getter such as `getHomeDashboard(range)` |

Keep mock-local types next to the fixtures. Do **not** put them in `src/types/` — that folder is for real API contracts.

## How a page reads mock data

Create a thin hook in `src/hooks/use-<domain>-*.ts` that returns the getter. Views must read through that hook, not import fixtures directly.

The hook is **synchronous**. Do not use `useQuery`, `queryKeys`, or `src/api/<domain>.ts` in this phase. Do not fake loading or error states. Do not wrap fixtures in the `{ code, data }` HTTP envelope.

Every mock reader must include this comment:

```ts
// TODO(api): replace mock read with TanStack Query when the backend contract is ready.
// 1. Add types in src/types/<domain>.ts from the real API (do not reuse mock-local types blindly).
// 2. Add src/api/<domain>.ts using http() and append the endpoint table in doc/api.md.
// 3. Add queryKeys.<domain> in src/api/query-keys.ts.
// 4. Switch this hook to useQuery ({ enabled: Boolean(token), queryFn: real api }).
// 5. Set MOCK_ENABLED.<domain> = false and delete src/mocks/<domain>.ts.
```

## Add a mock for a new page

1. Add a key to `MOCK_ENABLED` in `src/mocks/config.ts` (`true`).
2. Create `src/mocks/<domain>.ts` with local types, fixtures, and a getter. Copy and comments in English only.
3. Add `src/hooks/use-<domain>-*.ts` that returns the getter and includes the `TODO(api)` list.
4. Point the view at the hook. Empty states are `null` fields on the fixture, not a second code path.

## Replace a mock with the real API

1. Add types in `src/types/<domain>.ts` from the real contract. Do not reuse mock-local types blindly.
2. Add `src/api/<domain>.ts` using `http()`. Append a row to the endpoint table in [api.md](api.md).
3. Add `queryKeys.<domain>` in `src/api/query-keys.ts` for `useQuery` only.
4. Switch the hook to `useQuery` (`enabled: Boolean(token)`, `queryFn` calls the API).
5. Set `MOCK_ENABLED.<domain> = false` and delete `src/mocks/<domain>.ts`.
6. Remove that domain from the table below.

## Domains

| Domain | Flag | Fixtures | Hook |
| --- | --- | --- | --- |
| partner | `MOCK_ENABLED.partner` | `src/mocks/partner.ts` | `usePartner`, `usePartnerReports` (`getPartnerReports`) |

## Constraints

- Mock copy and identifiers are English only ([conventions.md](conventions.md)).
- Do not put mock logic in `src/components/ui/`.
- Do not invent `src/types/` or query keys until the backend contract exists.
