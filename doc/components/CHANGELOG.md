# Public Component Changelog

Record every create/update of components under `src/components/ui/` so other agents can discover new APIs.

## 2026-08-21

- **UI styles:** Tailwind class names live in the component files (not `config.ts`) so they are easier to maintain.
- **Card:** Initial public card primitive (`rounded-[20px]`, white border, `#FDFDFD`, 20px padding, shadow).
- **Dialog:** Centered modal on desktop; bottom drawer on viewports below 768px. Stacking overlays, mask, optional title, scrollable body.
- **Drawer:** Directional overlay (`top` / `right` / `bottom` / `left`) sharing Dialog chrome (mask, title, close, stacking).
- **Button:** `primary` / `normal` variants, `xl` / `lg` / `md` / `sm` sizes, `loading`, `rounded` override.
- **Tooltip:** Portal to `document.body`, closes on scroll, `leaveDelay` default `0`.
- **SearchInput:** Pill search field with `IconSearch` and custom clear control (native clear hidden).
- **Table:** CSS Grid compound table with sticky header and a single scroll container (no header/body column drift).
- **Dropdown:** Select-style menu; arrow rotates when open; panel portaled to `document.body`. First-open position uses an off-flow measure so the panel is not clamped to the left of the viewport.
