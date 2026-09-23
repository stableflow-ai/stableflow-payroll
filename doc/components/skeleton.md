# Skeleton

Path: `src/components/ui/skeleton/Skeleton.tsx`

Pulse block for a section that has not loaded yet. Colour matches the Overview page skeleton (`#e8e8e8`).

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `className` | `string` | — | Set height and width. The bar is `block`, `animate-pulse`, `rounded-[8px]`. |

Table first loads use [TableSkeletonRows](table.md) inside an existing `Table`, not this bar alone.
