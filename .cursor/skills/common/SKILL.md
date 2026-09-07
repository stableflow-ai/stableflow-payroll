---
name: common
description: Shared development conventions for creating pages, integrating APIs, and building feature modules. Use when adding pages, components, API integrations, or refactoring.
---

# Common Development Conventions

## Constants

- Extract all constants (enums, config values, mapping tables, and similar) into a sibling or nearby `config.ts`
- Prefer not extracting Tailwind classes or copy strings as constants
- Search the project for an existing constant before adding one; do not redeclare
- Name constants in `UPPER_SNAKE_CASE`

## Utility functions

- Extract shared helpers into `utils.ts` or a matching `utils/` directory
- Search the project for an equivalent helper before adding one; do not redeclare
- Feature-specific helpers go in that module's `utils.ts`; globally reusable helpers go in the root `utils/` directory

## Component reuse

- Reuse components that already do the same job; do not redeclare them
- Typical case: a component already shown on a page must be reused in a dialog or other surface, not rewritten
- Extract reusable components into their own files under the current module's `components/` directory or the shared `components/` directory

## Plans and task execution

- State in the Plan that browser verification is off by default unless I explicitly ask for it
- After a task, do not run browser verification unless I explicitly ask for it
- Default to English in code and docs
