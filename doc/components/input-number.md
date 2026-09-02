# InputNumber

Path: `src/components/ui/input-number/InputNumber.tsx`

Unstyled `<input type="text" inputMode="decimal">` that sanitises what the user types into a positive decimal string. It has no visual defaults at all — the caller styles it.

Sanitising, applied on every change before the handlers fire:

- Strips everything except digits and `.`
- Keeps only the first `.`
- Drops a leading zero followed by another digit (`012` becomes `12`)
- Clears a lone `.`
- Truncates the fraction to `decimals` digits when `decimals` is set

## Props

Extends `InputHTMLAttributes<HTMLInputElement>`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `onNumberChange` | `(value: string) => void` | — | Receives the sanitised string. This is the handler to use. |
| `decimals` | `number` | — | Maximum fractional digits. Pay screens pass `AMOUNT_MAX_DECIMALS`. |
| `onChange` | `ChangeEventHandler` | — | Still fired, with `event.target.value` already sanitised |

## Example

```tsx
import { InputNumber } from "@/components/ui/input-number/InputNumber";
import { AMOUNT_MAX_DECIMALS } from "@/views/pay/config";

<InputNumber
  value={amount}
  decimals={AMOUNT_MAX_DECIMALS}
  onNumberChange={setAmount}
  placeholder="0"
  className="min-w-0 flex-1 bg-transparent font-montserrat text-[26px] font-medium text-black outline-none"
/>
```

## Notes

- The value is a string, not a number, so precision survives. Convert with `big.js` from `@/utils` when you need arithmetic.
- Negative numbers and scientific notation are impossible by construction; do not add a `min` to compensate.
- `type` is fixed to `"text"` on purpose. A native number input would allow `e`, `+`, and locale separators.
