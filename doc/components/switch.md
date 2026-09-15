# Switch

Path: `src/components/ui/switch/Switch.tsx`

Animated toggle built on `motion/react`. Works controlled (`checked` + `onCheckedChange`) or uncontrolled (`defaultChecked`). Renders a `<button role="switch">` with `aria-checked`, so pass `aria-label` when there is no visible label.

## Defaults

- Track 34×20px, fully rounded, 1px border `#e3e3e3`
- Track colour animates between `#F6F6F6` (off) and `#6284F5` (on) over 200ms
- Thumb 16px, white, border `#d9d9d9`, springs 13px to the right when checked
- Disabled: `opacity: 0.3`, `cursor: not-allowed`, no pointer events
- Loading: `IconLoading` with `animate-spin` replaces the white thumb at the current on/off position. Track colour stays on the current `checked` value. Clicks are ignored. Opacity stays 1.

Constants: `SWITCH_TRACK_OFF_BG`, `SWITCH_TRACK_ON_BG`, `SWITCH_THUMB_TRAVEL_PX` in `./config`.

## Props

Extends `HTMLMotionProps<"button">` minus `onChange`, `role`, `aria-checked`, `children`, `animate`, `initial`, and `transition`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `checked` | `boolean` | — | Controlled state |
| `defaultChecked` | `boolean` | `false` | Uncontrolled initial state |
| `onCheckedChange` | `(checked: boolean) => void` | — | Fired with the next state |
| `disabled` | `boolean` | — | |
| `loading` | `boolean` | `false` | Spinner on the thumb; does not change `checked` by itself |
| `onClick` | `MouseEventHandler` | — | Runs first; call `preventDefault()` to veto the toggle |
| `className` | `string` | — | Track |

## Example

```tsx
import { Switch } from "@/components/ui/switch/Switch";

<Switch
  checked={notify}
  onCheckedChange={(checked) => {
    setNotify(checked);
    if (!checked) setEmail("");
  }}
  aria-label="Notify recipient"
/>
```

## Notes

- Use `onCheckedChange`, not `onChange` — the latter is stripped from the prop type.
- The animation values live in `config.ts`, not in the JSX; change them there so both the track and the thumb stay in step.
