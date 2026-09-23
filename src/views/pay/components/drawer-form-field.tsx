import type { ReactNode } from "react";
import { IconAlertCircle } from "@stableflow/pay-ui/icons/alert-circle";
import { cn } from "@/lib/utils";

export function DrawerFormField(props: {
  invalid?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const { invalid = false, className, children } = props;
  return (
    <span
      className={cn(
        "flex h-9 min-w-0 items-center gap-2 rounded-[6px] border px-3",
        invalid ? "border-[#FF5656] [&_input]:text-[#FF5656]" : "border-[#e3e3e3] [&_input]:text-black",
        className,
      )}
    >
      {children}
      {invalid ? (
        <span className="size-3 shrink-0 overflow-clip text-[#FF5656]">
          <IconAlertCircle className="size-3" />
        </span>
      ) : null}
    </span>
  );
}

export function DrawerFormFooter(props: {
  error: string | null;
  children: ReactNode;
}) {
  const { error, children } = props;
  return (
    <div className="sticky bottom-0 -mx-6 flex flex-col items-end gap-2 border-t border-black/10 bg-[#FDFDFD] px-6 py-5 sm:-mx-8 sm:px-8">
      <div className="flex justify-end gap-4">{children}</div>
      {error ? (
        <p className="max-w-full text-right font-montserrat text-xs font-medium text-[#FF5656]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
