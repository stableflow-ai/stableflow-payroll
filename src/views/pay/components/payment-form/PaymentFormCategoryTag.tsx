import { cn } from "@/lib/utils";
import type { PayableType } from "@/types/payable";
import {
  PAYMENT_FORM_CATEGORY_FALLBACK,
  PAYMENT_FORM_CATEGORY_UI,
} from "./config";

export function PaymentFormCategoryTag(props: {
  category: PayableType;
  className?: string;
  label?: string;
}) {
  const ui = PAYMENT_FORM_CATEGORY_UI[props.category] ?? PAYMENT_FORM_CATEGORY_FALLBACK;
  const Icon = ui.Icon;
  const label = props.label?.trim() || ui.label;
  return (
    <span
      className={cn(
        "inline-flex h-[30px] max-w-[93px] shrink-0 items-center gap-1 rounded-[8px] border px-1.5",
        ui.className,
        props.className,
      )}
    >
      <Icon className="size-3 shrink-0" />
      <span className="min-w-0 truncate font-montserrat text-xs font-medium">{label}</span>
    </span>
  );
}
