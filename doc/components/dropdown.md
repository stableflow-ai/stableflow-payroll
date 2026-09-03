# Dropdown

Path: `src/components/ui/dropdown/Dropdown.tsx`

Select-style trigger with a portalled option list. Works controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).

## Trigger defaults

- Height 36px, `border-radius: 6px`, border `#E3E3E3`, white background, `padding: 0 12px`
- Montserrat Medium 14px, black
- Optional `label` renders on the left in `#AAA`; the selected value then right-aligns
- `IconArrowDown` on the right rotates 180° while open
- Disabled: `opacity: 0.3`, `cursor: not-allowed`

## Panel defaults

Rendered into `document.body` at `z-index: 1100`, positioned below the trigger with a 6px offset and clamped to the viewport by `useFloatingPosition`. Minimum width matches the trigger. Radius 12px, border `#E0E0E0`, background `#FDFDFD`, shadow `0 0 20px 0 rgba(0,0,0,0.06)`.

Options are 14px Montserrat Medium; hover and the selected row use `rgba(0,0,0,0.05)`; disabled options are `opacity: 0.3`. When nothing is selected, the trigger placeholder is `#606060`.

It closes on outside pointer-down, Escape, or any scroll in the capture phase.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `options` | `DropdownOption[]` | required | `{ value: string; label: ReactNode; disabled?: boolean }` |
| `value` | `string` | — | Controlled selection |
| `defaultValue` | `string` | — | Uncontrolled initial selection |
| `onChange` | `(value: string) => void` | — | Fired on select, then the panel closes |
| `label` | `ReactNode` | — | Static prefix inside the trigger |
| `placeholder` | `string` | `"Select"` | Shown when nothing matches the current value; muted `#606060` |
| `disabled` | `boolean` | `false` | |
| `className` | `string` | — | Wrapper (`relative inline-block`) |
| `triggerClassName` | `string` | — | Trigger button |
| `panelClassName` | `string` | — | Portalled option list |
| `renderOption` | `(option, selected) => ReactNode` | — | Custom option row; the trigger still uses `option.label` |

Constant: `DROPDOWN_PLACEHOLDER` in `./config`.

## Example

```tsx
import { Dropdown } from "@/components/ui/dropdown/Dropdown";

<Dropdown
  value={status}
  onChange={(value) => { setStatus(value); setPage(1); }}
  className="flex-1 md:w-[141px]"
  triggerClassName="w-full"
  options={[
    { value: "all", label: "All Status" },
    { value: "completed", label: "Complete" },
    { value: "failed", label: "Failed" },
  ]}
/>
```

## Notes

- The wrapper is `inline-block`, so give it a width (`className="w-full"` or a fixed width) inside a flex row.
- There is no built-in search, multi-select, or infinite scroll. A long list needs a different component; do not bolt paging onto this one.
