import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PaginationProps = {
  className?: string;
  totalPage: number;
  page: number;
  onPageChange: (page: number) => void;
};

export function Pagination(props: PaginationProps) {
  const { className, totalPage, page, onPageChange } = props;
  const last = Math.max(totalPage, 1);
  const firstValid = page > 1;
  const nextValid = page < last;

  return (
    <div
      className={cn(
        "flex items-center gap-[15px] font-montserrat text-xs font-medium leading-[18px] text-black",
        className,
      )}
    >
      <PageButton
        disabled={!firstValid}
        aria-label="First page"
        onClick={() => onPageChange(1)}
      >
        <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path opacity={firstValid ? "1" : "0.3"} d="M9 1L4.2 6L9 11M1 1V11" stroke="currentColor" />
        </svg>
      </PageButton>
      <PageButton
        disabled={!firstValid}
        aria-label="Previous page"
        onClick={() => onPageChange(page - 1)}
      >
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path opacity={firstValid ? "1" : "0.3"} d="M6 1L1 6L6 11" stroke="currentColor" />
        </svg>
      </PageButton>
      <div className="flex items-center">
        {page}/{last}
      </div>
      <PageButton
        disabled={!nextValid}
        aria-label="Next page"
        onClick={() => onPageChange(page + 1)}
      >
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path opacity={nextValid ? "1" : "0.3"} d="M1 1L6 6L1 11" stroke="currentColor" />
        </svg>
      </PageButton>
      <PageButton
        disabled={!nextValid}
        aria-label="Last page"
        onClick={() => onPageChange(last)}
      >
        <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path opacity={nextValid ? "1" : "0.3"} d="M1 1L5.8 6L1 11M9 1V11" stroke="currentColor" />
        </svg>
      </PageButton>
    </div>
  );
}

export default Pagination;

function PageButton(
  props: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode },
) {
  const { className, children, ...restProps } = props;
  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center disabled:cursor-not-allowed",
        className,
      )}
      {...restProps}
    >
      {children}
    </button>
  );
}
