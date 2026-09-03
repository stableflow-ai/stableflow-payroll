# Toast

Path: `src/components/ui/toast/Toast.tsx`
Hook: `src/hooks/use-toast.tsx`

Notification card rendered inside `react-toastify`. Call the `useToast()` hook; do not import `react-toastify` or the `Toast` component from a feature.

The `ToastContainer` lives in `src/App.tsx` (bottom-right, no progress bar, transparent wrapper, oldest toward the top, no default close button). The hook positions each toast bottom-right with the `decash-toast decash-toast-bottom-right` class; the matching styles are in `src/styles.css`. New toasts sit at the bottom of the stack; earlier ones move up.

The public card has no business copy, actions, or progress fields. Callers pass `title` / `text` as `ReactNode` when they need custom markup (for example an in-progress line with a View control). Use `info` for those states.

## `useToast()`

| Method | Type | Status row |
| --- | --- | --- |
| `success(params)` | `success` | Green `IconCheck` plus `#84a20f` text when `text` is set |
| `fail(params)` | `error` | `#606060` text when `text` is set |
| `info(params)` | `info` | `#606060` text when `text` is set |
| `loading(params)` | `pending` | `#606060` text when `text` is set |
| `notice(params)` | `notice` | `#606060` text when `text` is set |
| `dismiss` | `toast.dismiss` from react-toastify | — |

`params`:

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `ReactNode` | required | First line |
| `text` | `ReactNode` | — | Optional second line. Omit it for a title-only toast |
| `duration` | `number \| false` | `3000` | Milliseconds, or `false` to keep it open until dismissed |

Each method returns a `ToastHandle`:

| Field | Notes |
| --- | --- |
| `id` | react-toastify id |
| `update(params)` | Same toast, new `title` / `text` (and `duration` if passed). Does not close or create another toast |
| `dismiss()` | Closes this toast |

## Toast props

Only needed if you render the card outside the hook.

| Prop | Type | Notes |
| --- | --- | --- |
| `type` | `ToastType` | `success \| error \| info \| pending \| notice` |
| `title` | `ReactNode` | |
| `text` | `ReactNode` | Optional |
| `className` | `string` | |
| `closeToast` | `() => void` | Injected by react-toastify |

Card defaults: 316px wide (`calc(100vw - 32px)` below `md`), `#fdfdfd`, `border #e0e0e0`, `border-radius: 12px`, shadow `0 0 20px 0 rgba(0,0,0,0.06)`, Montserrat title in 16px semibold black.

## Example

```tsx
import useToast from "@/hooks/use-toast";

const toast = useToast();

toast.success({ title: "Payment submitted" });
toast.fail({ title: formatQuoteErrorMessage(error, 2) });

toast.success({
  title: "Paying to Andrew 0x541...8dc1",
  text: "Transaction success!",
});

const pending = toast.info({
  title: "September Payroll",
  duration: false,
  text: (
    <span className="flex w-full items-center justify-between gap-2">
      <span>
        <span className="text-[#003bff]">2 / 12 </span>
        Transactions are in progress...
      </span>
      <button type="button" className="text-[#003bff]">View</button>
    </span>
  ),
});
pending.update({
  text: (
    <span className="flex w-full items-center justify-between gap-2">
      <span>
        <span className="text-[#003bff]">3 / 12 </span>
        Transactions are in progress...
      </span>
      <button type="button" className="text-[#003bff]">View</button>
    </span>
  ),
});
```

## Notes

- `useToast` is a default export; import it without braces.
- Toast copy is user-facing, so it is English and short. Long backend errors go through a formatter (`formatQuoteErrorMessage`, `authErrorMessage`) before they reach a toast.
- Progress counts, View links, and similar product UI belong in the caller’s `text` node, not in `Toast`.
