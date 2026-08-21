# Agent Guide

Read these documents before changing this repository:

- [doc/conventions.md](doc/conventions.md) — coding and documentation rules
- [doc/product.md](doc/product.md) — product areas, routes, and constraints
- [doc/project-structure.md](doc/project-structure.md) — folder map and stack
- [doc/api.md](doc/api.md) — HTTP client, TanStack Query, Zustand session, adding endpoints
- [doc/mocks.md](doc/mocks.md) — mock data while an API contract is missing
- [doc/utils.md](doc/utils.md) — shared helpers (`@/utils`)
- [doc/components/README.md](doc/components/README.md) — public UI components
- [doc/components/CHANGELOG.md](doc/components/CHANGELOG.md) — public component change log

When you add or change a public component under `src/components/ui/`, update the matching file in `doc/components/` and append an entry to `doc/components/CHANGELOG.md`.

When you add or change a shared util under `src/utils/`, update [doc/utils.md](doc/utils.md). Search existing utils before writing a new helper.

When you add or change a backend endpoint, follow [doc/api.md](doc/api.md) and append the route to its endpoint table.

When a page needs data before the backend contract exists, follow [doc/mocks.md](doc/mocks.md). Do not invent `src/types/` or query keys in that phase.
