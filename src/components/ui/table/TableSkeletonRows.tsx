import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { TableBody, TableCell, TableRow } from "./Table";

export const TABLE_SKELETON_ROWS = 3;

export function TableSkeletonRows({
  cells,
  rows = TABLE_SKELETON_ROWS,
}: {
  cells: number;
  rows?: number;
}) {
  return (
    <TableBody aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, row) => (
        <TableRow key={row}>
          {Array.from({ length: cells }, (_, cell) => (
            <TableCell key={cell}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
