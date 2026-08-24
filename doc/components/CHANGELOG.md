# Public Component Changelog

Record every create/update of components under `src/components/ui/` so other agents can discover new APIs.

## 2026-08-24

- **DateRangePicker:** Shared time-range calendar (presets + two-click range). Extracted from Partner Reports for History.
- **Table:** Scroll children wrap in `w-max min-w-full` so the header spans the horizontal overflow; `toolbar` / `footer` sit outside the scroller; cells use `min-w-0`.
- **Dropdown:** Optional `label` prefix on the trigger (gray, left; selected value stays right-aligned). Narrow triggers truncate label/value and keep the chevron inside (`overflow-hidden`).
- **Pagination:** Restyled to Montserrat / currentColor; typed `page`, `totalPage`, `onPageChange`.
- **SearchInput / Dropdown:** Default placeholders (`Search` / `Select`) live on the component, not sibling `config.ts`.
- **Tooltip:** `leaveDelay` `0` (default) sets `pointer-events: none` on the panel so it cannot cover the trigger and flicker.
- **Overlay (`useFloatingPosition`):** Measure the panel without forcing `width: max-content`, so className widths such as `w-[285px]` are used for placement.

## 2026-08-21

- **Dialog / OverlayPanel / Drawer:** optional `headerAction` next to the title (outside `<h2>`).
- **UI styles:** Tailwind class names live in the component files (not `config.ts`) so they are easier to maintain.
- **Card:** Initial public card primitive (`rounded-[20px]`, white border, `#FDFDFD`, 20px padding, shadow).
- **Dialog:** Centered modal on desktop; bottom drawer on viewports below 768px. Stacking overlays, mask, optional title, scrollable body.
- **Drawer:** Directional overlay (`top` / `right` / `bottom` / `left`) sharing Dialog chrome (mask, title, close, stacking).
- **Button:** `primary` / `normal` variants, `xl` / `lg` / `md` / `sm` sizes, `loading`, `rounded` override.
- **Tooltip:** Portal to `document.body`, closes on scroll, `leaveDelay` default `0`.
- **SearchInput:** Pill search field with `IconSearch` and custom clear control (native clear hidden).
- **Table:** CSS Grid compound table with sticky header and a single scroll container (no header/body column drift).
- **Dropdown:** Select-style menu; arrow rotates when open; panel portaled to `document.body`. First-open position uses an off-flow measure so the panel is not clamped to the left of the viewport.
- **Switch:** Pill toggle (`33.333×20`). Off track `#F6F6F6`, on track `#6284F5`. Thumb slides with Motion.
