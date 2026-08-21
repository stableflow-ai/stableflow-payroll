# Agent Guide

Read these documents before changing this repository:

- [doc/conventions.md](doc/conventions.md) — coding and documentation rules
- [doc/project-structure.md](doc/project-structure.md) — folder map and stack
- [doc/api.md](doc/api.md) — HTTP client, TanStack Query, Zustand session, adding endpoints
- [doc/utils.md](doc/utils.md) — shared helpers (`@/utils`)
- [doc/components/README.md](doc/components/README.md) — public UI components
- [doc/components/CHANGELOG.md](doc/components/CHANGELOG.md) — public component change log

When you add or change a public component under `src/components/ui/`, update the matching file in `doc/components/` and append an entry to `doc/components/CHANGELOG.md`.

When you add or change a shared util under `src/utils/`, update [doc/utils.md](doc/utils.md). Search existing utils before writing a new helper.

When you add or change a backend endpoint, follow [doc/api.md](doc/api.md) and append the route to its endpoint table.
