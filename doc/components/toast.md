# Toast

Path: `src/components/ui/toast/Toast.tsx`
Hook: `src/hooks/use-toast.tsx`

Notification card rendered inside `react-toastify`. Call the `useToast()` hook; do not import `react-toastify` or the `Toast` component from a feature.

The `ToastContainer` lives in `src/App.tsx` (top-right, no progress bar, transparent wrapper, newest on top, no default close button). The hook positions each toast top-right with the `decash-toast decash-toast-top-right` class; the matching styles are in `src/styles.css`.

## `useToast()`

| Method | Type | Icon |
| --- | --- | --- |
| `success(params)` | `success` | Green check |
| `fail(params)` | `error` | Pink cross |
| `info(params)` | `info` | Blue info |
| `loading(params)` | `pending` | Spinning `IconProcessing` |
| `notice(params)` | `notice` | Amber megaphone |
| `dismiss` | `toast.dismiss` from react-toastify | — |

`params`:

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `string` | required | First line |
| `text` | `string` | — | Optional second line |
| `duration` | `number \| false` | `3000` | Milliseconds, or `false` to keep it open until dismissed |

Each method returns the react-toastify id, so a pending toast can be dismissed later.

## Toast props

Only needed if you render the card outside the hook.

| Prop | Type | Notes |
| --- | --- | --- |
| `type` | `ToastType` | `success \| error \| info \| pending \| notice` |
| `title` | `string` | |
| `text` | `string` | Optional |
| `className` | `string` | |
| `closeToast` | `() => void` | Injected by react-toastify |

Card defaults: 288px wide (`calc(100vw - 32px)` below `md`), white, `border-radius: 12px`, shadow `0 0 6px 0 rgba(0,0,0,0.10)`, Space Grotesk text in `#444C59`.

## Example

```tsx
import useToast from "@/hooks/use-toast";

const toast = useToast();

toast.success({ title: "Payment submitted" });
toast.fail({ title: formatQuoteErrorMessage(error, 2) });

const id = toast.loading({ title: "Broadcasting…", duration: false });
toast.dismiss(id);
```

## Notes

- `useToast` is a default export; import it without braces.
- Toast copy is user-facing, so it is English and short. Long backend errors go through a formatter (`formatQuoteErrorMessage`, `authErrorMessage`) before they reach a toast.
