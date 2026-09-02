# Development Conventions

Rules for humans and agents working in this repository. Anything committed to `src/` or `doc/` must be English.

## Language

- Code, comments, identifiers, user-facing copy, mock fixtures, and documentation must be written in **English** only.
- Do not add any other language to source files or `doc/`.
- `"PingFang SC"` in `src/styles.css` is a font-family fallback, not copy. Leave it alone.

## Public components

- Shared, non-business UI lives in `src/components/ui/<component-name>/`.
- Business widgets stay next to their feature (for example `src/views/pay/components/PaySidebar.tsx`) or in a named shared folder when several features use them (`src/components/token-select-dialog/`, `src/components/date-range-picker/`, `src/components/WalletConnect.tsx`). Do not put business logic in `src/components/ui/`.
- Reuse existing public components. Do not duplicate Card, Dialog, Button, Table, and similar primitives.
- Constants (enums, breakpoints, copy defaults) belong in a sibling `config.ts` using `UPPER_SNAKE_CASE`.
- `src/components/ui/overlay/` is internal plumbing for Dialog, Drawer, Dropdown, and Tooltip. Do not import it from feature code.
- After creating or changing a public component:
  1. Update `doc/components/<name>.md` (props, examples, caveats).
  2. Append an entry to `doc/components/CHANGELOG.md` so others can discover the change.

## Shared utils

- Before adding a helper, search `src/utils/` (`@/utils`) and `src/lib/`. Do not reimplement an existing function.
- Put a helper in `src/utils/` only if it is generally reusable across features. Feature-specific helpers belong in that feature's `utils.ts` (for example `src/views/pay/utils.ts`, `src/views/pay/batch-utils.ts`).
- Split files by purpose and re-export from `src/utils/index.ts`.
- After adding or changing a public util, update [utils.md](utils.md).
- `cn()` stays in `src/lib/utils.ts` (shadcn alias). HTTP, RPC clients, logo helpers, CSV import, Google integration, and confidential-payment helpers stay in `src/lib/`.

## Styling

- Use Tailwind + `cn()` from `@/lib/utils`. Put class names in the component JSX / `cva` call, not in `config.ts`.
- Public components must accept `className` (and named `*ClassName` props where the component already defines them) so callers can override defaults.
- Tailwind is v4 with no `tailwind.config.js`. Theme tokens live in `src/shadcn-tailwind.css` (`:root` variables plus `@theme inline`). Add a token there rather than hard-coding the same hex in five components.

## Icons

One pattern only. Do not mix `public/` SVGs, a separate `svgs/` folder, and inline markup.

- Figma UI glyphs live only in `src/components/icons/<kebab-name>.tsx`.
- Each file is a React component: `IconProps` from `./types` (`className`, `style`), inline SVG, `stroke="currentColor"` or `fill="currentColor"`, named export `IconXxx`, re-exported from `src/components/icons/index.tsx`.
- A file may export more than one glyph when they belong together (`up.tsx` exports `IconUp` and `IconBatchUp`).
- Before adding an icon, read `src/components/icons/index.tsx` and the matching file. If Figma names differ, compare `path` / `viewBox`. Do not duplicate.
- **Forbidden:** `src/components/icons/svgs/`, `src/components/icons/assets/`, UI icons under `public/`, new inline SVGs in pages or feature components, third-party icon packs (lucide and similar).
- Prefer existing icons over drawing new glyphs.

## Static assets (logo and page art)

- Product logo on a light background: `/logo.svg` (`public/logo.svg`).
- Product logo on a dark background: `/logo-white.svg` (`public/logo-white.svg`).
- Logos are not icons. Do not copy them into `src/components/icons/`.
- Existing Auth decoration stays at `public/auth/brand-mark-vector.svg`. It is not the product logo and not an icon. Do not convert existing logo or auth SVGs to PNG.
- New non-icon artwork from Figma (illustrations, photos, page decorations): `public/<page-or-area>/<name>.png`. Example: Pay art goes to `public/pay/*.png`.
- Remote chain / token logos come from `src/lib/logo.ts` (`assets.dapdap.net`). Do not copy them into `public/`.

## Responsive

- There is no separate mobile design. Adapt the desktop frame. Do not invent a separate mobile visual system.
- Narrow viewport is below `768px` (Tailwind `md`), matching `DESKTOP_MEDIA_QUERY` in `src/components/ui/overlay/config.ts`.
- [Dialog](components/dialog.md) already falls back to a bottom [Drawer](components/drawer.md) below that breakpoint. Use Drawer for menus and filter panels too. Do not build a second mobile nav.
- The Pay sidebar collapses to a horizontal scroller below `lg`; the app header exposes a second nav row below `md`. Follow those patterns instead of adding a new one.
- Tables may scroll horizontally. Do not invent a second information architecture for narrow screens unless the user has approved it.

## Figma MCP

- If `get_design_context`, `get_screenshot`, or another Figma MCP call fails (node mismatch, expired token, empty payload): **stop**. Tell the user to refresh the Figma MCP connection and retry.
- Do not guess the layout, substitute a nearby node, or copy another screen in place of the current file.

## Ask before guessing

- Ambiguous copy, breakpoints, Figma vs code, or a missing API contract: list options and wait for the user to decide.
- Do not pick a "reasonable" default and finish the work.

## State

- Cross-page client state lives in Zustand stores under `src/stores/`. See the store table in [project-structure.md](project-structure.md).
- The JWT session (`token` + `user`) is the one exception to "stores own their own persistence": it is read and written by `src/lib/auth-session.ts` under the key `stableflow-pay.session`, and `useAuthStore` hydrates from it on first import. Go through `getStoredSession` / `setStoredSession` / `clearStoredSession` / `getAuthToken`; never touch that key directly.
- Every other store that must survive a reload uses Zustand `persist` (`quick-pay-commit-queue`, `batch-payout-commit-queue`, `intents-tokens`, `quick-pay-prefs`).
- Do not read or write `localStorage` / `sessionStorage` from features, pages, or hooks, and do not add another storage wrapper.
- Server lists, details, and quotes stay in TanStack Query. Do not copy them into Zustand.
- Page-local UI (dialog open, input value, wizard step) uses component `useState`. Do not lift it into a store.

## TypeScript

- Use `import type` for type-only imports (`verbatimModuleSyntax` is enabled).
- Do not use TypeScript `enum`. Use `const` objects plus derived types:

```ts
export const PAY_REQUEST_MODE = {
  Standard: "standard",
  Private: "private",
} as const;

export type PayRequestMode = (typeof PAY_REQUEST_MODE)[keyof typeof PAY_REQUEST_MODE];
```

- `strict` is on and there is no ESLint or Prettier config. `pnpm check` (`tsc -b`) and `pnpm test` (Vitest) are the gate; keep both green.
