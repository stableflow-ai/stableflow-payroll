import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card/Card";

type TableContextValue = {
  columns: string;
};

const TableContext = createContext<TableContextValue | null>(null);

function useTableContext() {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error("Table compound components must be used within Table.");
  }
  return context;
}

function columnsStyle(columns: string): CSSProperties {
  return { gridTemplateColumns: columns };
}

export type TableProps = HTMLAttributes<HTMLDivElement> & {
  columns: string;
  scrollClassName?: string;
  toolbar?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
};

export function Table(props: TableProps) {
  const {
    columns,
    className,
    scrollClassName,
    toolbar,
    footer,
    children,
    style,
    ...restProps
  } = props;

  return (
    <TableContext.Provider value={{ columns }}>
      <Card
        className={cn("flex min-h-0 flex-col overflow-hidden p-5", className)}
        style={style}
        {...restProps}
      >
        {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
        <div
          className={cn("min-h-0 flex-1 overflow-auto", scrollClassName)}
          style={{ scrollbarGutter: "stable" }}
        >
          <div className="w-max min-w-full">{children}</div>
        </div>
        {footer ? <div className="shrink-0">{footer}</div> : null}
      </Card>
    </TableContext.Provider>
  );
}

export type TableHeaderProps = HTMLAttributes<HTMLDivElement>;

export function TableHeader(props: TableHeaderProps) {
  const { className, style, ...restProps } = props;
  const { columns } = useTableContext();

  return (
    <div
      className={cn(
        "sticky top-0 z-10 grid w-full min-w-min border-b border-black/10 bg-[#FDFDFD] font-montserrat text-sm font-medium capitalize text-[#aaa]",
        className,
      )}
      style={{ ...columnsStyle(columns), ...style }}
      {...restProps}
    />
  );
}

export type TableBodyProps = HTMLAttributes<HTMLDivElement>;

export function TableBody(props: TableBodyProps) {
  const { className, ...restProps } = props;
  return <div className={cn("w-full", className)} {...restProps} />;
}

export type TableRowProps = HTMLAttributes<HTMLDivElement>;

export function TableRow(props: TableRowProps) {
  const { className, style, ...restProps } = props;
  const { columns } = useTableContext();

  return (
    <div
      className={cn(
        "grid w-full min-w-min border-b border-black/10 font-montserrat text-sm font-medium text-black last:border-b-0",
        className,
      )}
      style={{ ...columnsStyle(columns), ...style }}
      {...restProps}
    />
  );
}

export type TableHeadProps = HTMLAttributes<HTMLDivElement>;

export function TableHead(props: TableHeadProps) {
  const { className, ...restProps } = props;
  return (
    <div className={cn("flex min-w-0 items-center px-2 py-3.5 first:pl-0 last:pr-0", className)} {...restProps} />
  );
}

export type TableCellProps = HTMLAttributes<HTMLDivElement>;

export function TableCell(props: TableCellProps) {
  const { className, ...restProps } = props;
  return (
    <div className={cn("flex min-w-0 items-center px-2 py-3.5 first:pl-0 last:pr-0", className)} {...restProps} />
  );
}

export default Table;
