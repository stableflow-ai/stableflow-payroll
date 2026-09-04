# Agent Guide

Read these documents before changing this repository:

- [doc/conventions.md](doc/conventions.md) — coding and documentation rules
- [doc/product.md](doc/product.md) — product areas, routes, and constraints
- [doc/project-structure.md](doc/project-structure.md) — folder map and stack
- [doc/api.md](doc/api.md) — HTTP client, TanStack Query, session, adding endpoints
- [doc/mocks.md](doc/mocks.md) — mock data while an API contract is missing
- [doc/utils.md](doc/utils.md) — shared helpers (`@/utils`)
- [doc/components/README.md](doc/components/README.md) — public UI components
- [doc/components/CHANGELOG.md](doc/components/CHANGELOG.md) — public component change log

## Hard rules

- **English only** in `src/` and `doc/` (code, comments, identifiers, user-facing copy).
- **Released surface is Auth, `/` (Overview), and `/pay/*`.** `/howitworks` is a live public page. The public payer (`/p/:id`), Home (`HomeView`), Analytics, and Partner routes are commented out in `src/router/index.tsx`; their code still exists. Do not re-enable or extend a disabled area unless asked.
- **Icons** are React components in `src/components/icons/` (inline SVG, `currentColor`, re-export from `index.tsx`). Do not put UI icons in `public/`, split SVGs into another folder, or inline new glyphs in pages.
- **Logos** are `/logo.svg` and `/logo-white.svg`. New non-icon page art is `public/<page>/*.png`. Do not put either in `src/components/icons/`.
- **Session** (`token` + `user`) is read and written only through `src/lib/auth-session.ts` (key `stableflow-pay.session`); `useAuthStore` mirrors it. Every other cross-page client state uses Zustand in `src/stores/` (`persist` when it must survive reload). Do not read or write `localStorage` / `sessionStorage` anywhere else. Server data stays in TanStack Query. Page-local UI uses `useState`.
- **Figma MCP failure:** stop, ask the user to refresh the Figma MCP connection, then retry. Do not guess the design.
- **Ambiguity:** list options and wait. Do not pick a silent default and finish the work.
- Narrow viewport is below `768px`. Dialog already falls back to a bottom Drawer there; use Drawer for menus and filters too. Do not invent a mobile visual system.
- `src/components/ui/overlay/` is internal. Do not import it from a view or feature component.
- There is no ESLint or Prettier config. Keep `pnpm check` (`tsc -b`) and `pnpm test` (Vitest) green.

When you add or change a public component under `src/components/ui/` (or a shared widget listed in `doc/components/README.md`), update the matching file in `doc/components/` and append an entry to [doc/components/CHANGELOG.md](doc/components/CHANGELOG.md).

When you add or change a shared util under `src/utils/`, update [doc/utils.md](doc/utils.md). Search existing utils before writing a new helper.

When you add or change a backend endpoint, follow [doc/api.md](doc/api.md) and append the route to its endpoint table.

When a page needs data before the backend contract exists, follow [doc/mocks.md](doc/mocks.md). Do not invent `src/types/` entries or query keys in that phase.
