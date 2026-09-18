# Autocomplete

Path: `src/components/ui/autocomplete/Autocomplete.tsx`

Typeahead panel that portals under a caller-provided trigger. Open state is controlled (`open` + `onOpenChange`). Selecting an option fires `onSelect` and then closes the panel.

## Trigger

`children` is the trigger. The wrapper is `relative min-w-0`; give it `className="flex-1"` (or a width) inside a flex row. The portalled list's minimum width matches the trigger.

## Panel defaults

Rendered into `document.body`. `z-index` is `floatingLayerZIndex()` from the overlay stack: `1100` when no overlay is open, otherwise the current top overlay plus 10 so the list stays above Dialog / Drawer. Positioned below the trigger with a 6px offset and clamped to the viewport by `useFloatingPosition`. Radius 12px, border `#E0E0E0`, background `#FDFDFD`, shadow `0 0 20px 0 rgba(0,0,0,0.06)`. Max height `15rem` with vertical overflow so long lists scroll.

When `loading` is true, the panel shows `Loading...` instead of options. When `options` is empty and not loading, the panel shows `empty` (`"No matching recipients"` by default).

It closes on outside pointer-down, Escape, or any scroll in the capture phase, except scroll inside the option panel itself.

## Keyboard

While the panel is open, ArrowDown / ArrowUp move the highlight among enabled options (wrapping). The first ArrowDown from no highlight lands on the first enabled row; nothing is highlighted until that or a mouse enter. Enter selects the highlighted row and closes; with no highlight, Enter does nothing. Escape still closes.

The active row uses `bg-black/5` (same as Dropdown's selected row) and `aria-selected`. Optional `value` restores that highlight when the panel reopens.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `open` | `boolean` | required | Controlled visibility |
| `onOpenChange` | `(open: boolean) => void` | — | `false` on outside click, Escape, scroll, or select |
| `options` | `AutocompleteOption[]` | required | `{ value: string; label: ReactNode; disabled?: boolean }` |
| `onSelect` | `(value: string) => void` | required | Fired on select, then the panel closes |
| `value` | `string` | — | Option value to highlight when the panel opens |
| `loading` | `boolean` | `false` | Open panel shows `Loading...` instead of options |
| `empty` | `ReactNode` | `"No matching recipients"` | Shown when `options` is empty |
| `className` | `string` | — | Wrapper (`relative min-w-0`) |
| `panelClassName` | `string` | — | Portalled option list |
| `children` | `ReactNode` | required | Trigger (input, combobox chrome) |
| `renderOption` | `(option, active) => ReactNode` | — | Custom option row; `active` is the keyboard / hover highlight |

Constants: `AUTOCOMPLETE_EMPTY` and `AUTOCOMPLETE_LOADING` in `./config`.

## Example

```tsx
import { Autocomplete } from "@/components/ui/autocomplete/Autocomplete";

<Autocomplete
  open={open}
  onOpenChange={setOpen}
  options={options}
  value={selectedId}
  onSelect={selectRecipient}
  loading={loading}
>
  <input value={query} onChange={(event) => setQuery(event.target.value)} />
</Autocomplete>
```

## Notes

- This is not a form field. The caller owns the input value, debounce, and fetch.
- Do not import overlay helpers from a view; use this component instead of `useFloatingPosition`.
