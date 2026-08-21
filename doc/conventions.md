# Development Conventions

Rules for humans and agents working in this repository. Additional rules may be appended later.

## Language

- Code, comments, identifiers, user-facing copy, and documentation must be written in **English** only.
- Do not add any other language to source files or `doc/`.

## Public components

- Shared, non-business UI lives in `src/components/ui/<component-name>/`.
- Business widgets stay next to their feature (for example `src/components/WalletConnect.tsx` or a future feature folder). Do not put business logic in `src/components/ui/`.
- Reuse existing public components. Do not duplicate Card, Dialog, Button, Table, and similar primitives.
- Constants (enums, breakpoints, copy defaults) belong in a sibling `config.ts` using `UPPER_SNAKE_CASE`.
- Shared helpers belong in `utils.ts` or `src/lib/`. Check for an existing helper before adding a new one.
- After creating or changing a public component:
  1. Update `doc/components/<name>.md` (props, examples, caveats).
  2. Append an entry to `doc/components/CHANGELOG.md` so others can discover the change.

## Styling

- Use Tailwind + `cn()` from `@/lib/utils`. Put class names in the component JSX/`cva` call, not in `config.ts`.
- Public components must accept `className` (and named `*ClassName` props where the plan/API already defines them) so callers can override defaults.
- Prefer existing icons in `src/components/icons/` over inline SVGs.

## TypeScript

- Use `import type` for type-only imports (`verbatimModuleSyntax` is enabled).
- Do not use TypeScript `enum`. Use `const` objects plus derived types.

## Additional rules

- (Add new project-wide constraints here.)
