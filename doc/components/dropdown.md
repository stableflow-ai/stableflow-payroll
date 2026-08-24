# Dropdown

Path: `src/components/ui/dropdown/Dropdown.tsx`

Figma: Decash `817:23133` (trigger). Select-style menu, not an action menu.

The trigger uses `IconArrowDown`; the icon rotates `180deg` while open. The panel is portaled to `document.body` with:

- `border-radius: 12px`
- `border: 1px solid #E0E0E0`
- `background: #FDFDFD`
- `box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.06)`
- Montserrat Medium 16px / `#000`

Closes on outside click, Escape, and scroll.

The panel is `position: fixed`. `useFloatingPosition` measures it off-flow (hidden, origin `0,0`) before clamping, and keeps CSS width classes such as `w-[285px]` / `w-max` so the first open is not pinned to the left edge of the viewport.

## Trigger defaults

- Height 36px, `border-radius: 6px`
- Border `#E3E3E3`, background `#FFF`
- Montserrat Medium 14px / `#000`
- Trigger is `overflow-hidden`; label and value truncate so the chevron stays inside when the control is narrow.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `options` | `{ value: string; label: ReactNode; disabled?: boolean }[]` | required | |
| `label` | `ReactNode` | — | Optional prefix on the trigger (gray, left-aligned) |
| `value` | `string` | — | Controlled value |
| `defaultValue` | `string` | — | Uncontrolled initial value |
| `onChange` | `(value: string) => void` | — | Fired on select |
| `placeholder` | `string` | `"Select"` | Shown when nothing is selected |
| `disabled` | `boolean` | `false` | |
| `className` | `string` | — | Outer wrapper |
| `triggerClassName` | `string` | — | Trigger button |
| `panelClassName` | `string` | — | Portaled panel |

## Example

```tsx
import { Dropdown } from "@/components/ui/dropdown/Dropdown";

<Dropdown
  value={status}
  onChange={setStatus}
  triggerClassName="w-[141px]"
  options={[
    { value: "all", label: "All Status" },
    { value: "complete", label: "Complete" },
    { value: "pending", label: "Pending" },
  ]}
/>
```
