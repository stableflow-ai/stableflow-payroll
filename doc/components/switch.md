# Switch

Path: `src/components/ui/switch/Switch.tsx`

Figma: Decash off `392:20554`, on `395:21220`.

Pill toggle. The thumb slides with Motion; the track color tweens between off and on.

## Defaults

- Size `33.333px × 20px`, fully rounded
- Off track `#F6F6F6`, on track `#6284F5`, 1px border `#E3E3E3`
- Thumb `15px` white circle, 1px border `#D9D9D9`, 13px travel
- Disabled: `opacity: 0.3` and `cursor: not-allowed` (`pointer-events: none`)

## Props

Omits native `onChange` / `role` / `aria-checked` / `children`, plus Motion `animate` / `initial` / `transition`. Other button attributes are forwarded.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `checked` | `boolean` | — | Controlled. Omit for uncontrolled |
| `defaultChecked` | `boolean` | `false` | Uncontrolled initial value |
| `onCheckedChange` | `(checked: boolean) => void` | — | Fires after a toggle |
| `className` | `string` | — | Track (`<button>`) overrides |
| `disabled` | `boolean` | — | Same visual treatment as Button |

Constants: `SWITCH_TRACK_OFF_BG`, `SWITCH_TRACK_ON_BG`, `SWITCH_THUMB_TRAVEL_PX` in `./config`.

## Example

```tsx
import { Switch } from "@/components/ui/switch/Switch";

<Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Confidential payments" />
```
