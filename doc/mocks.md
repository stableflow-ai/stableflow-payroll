# Mock Data

## When to use a mock

Only when a page has to be built before the backend contract exists. If the endpoint is already specified, follow [api.md](api.md) instead and skip this file.

A mock is temporary scaffolding. It ships with a `TODO(api)` marker and is deleted in the same pull request that wires the real endpoint.

## Layout

| Path | Role |
| --- | --- |
| `src/mocks/config.ts` | `MOCK_ENABLED` switchboard and the derived `MockDomain` type |
| `src/mocks/<domain>.ts` | Fixtures and the reader function for one domain |

`MOCK_ENABLED` is currently `{}` — no domain is mocked and every page reads the real API.

## How a page reads mock data

Never import a fixture into a view. Go through the same hook the real API will use, and mark it:

```ts
/**
 * TODO(api): mock data until the <domain> contract exists.
 * Replace with:
 *   1. types in src/types/<domain>.ts
 *   2. a function in src/api/<domain>.ts
 *   3. a key in src/api/query-keys.ts
 *   4. queryFn -> the real api function
 *   5. delete src/mocks/<domain>.ts and its MOCK_ENABLED entry
 */
```

## Add a mock for a new page

1. Add `<domain>: true` to `MOCK_ENABLED` in `src/mocks/config.ts`.
2. Create `src/mocks/<domain>.ts` with the fixtures and a reader function. Keep the shape as close to the expected response as you can, and keep every string English.
3. Create `src/hooks/use-<domain>-api.ts` with a hook whose `queryFn` returns the mock while `MOCK_ENABLED.<domain>` is set. Put the `TODO(api)` block above it.
4. Have the page call the hook. Do not add `src/types/<domain>.ts` or a `queryKeys` namespace yet — those belong to the real contract.

## Replace a mock with the real API

1. Add the types to `src/types/<domain>.ts`.
2. Add the function to `src/api/<domain>.ts`.
3. Add the key to `src/api/query-keys.ts`.
4. Point the hook's `queryFn` at the real function and delete the `TODO(api)` block.
5. Delete `src/mocks/<domain>.ts`.
6. Remove the entry from `MOCK_ENABLED` and update the table below.

## Domains

| Domain | Mock file | Reader hook | Notes |
| --- | --- | --- | --- |
| — | — | — | No mock domains. |

## Constraints

- Mocks live only under `src/mocks/`. Do not inline fixture arrays in a view, a component, or a store.
- Fixtures are English, like the rest of `src/`.
- Do not mock a domain that already has a working endpoint just to develop offline.
