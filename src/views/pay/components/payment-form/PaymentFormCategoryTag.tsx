import { cn } from "@/lib/utils";
import type { PaymentFormCategory } from "@/hooks/use-payment-forms-api";
import { PAYMENT_FORM_CATEGORY_UI } from "./config";

export function PaymentFormCategoryTag(props: {
  category: PaymentFormCategory;
  className?: string;
}) {
  const ui = PAYMENT_FORM_CATEGORY_UI[props.category];
  const Icon = ui.Icon;
  return (
    <span
      className={cn(
        "inline-flex h-[30px] max-w-[93px] shrink-0 items-center gap-1 rounded-[8px] border px-1.5",
        ui.className,
        props.className,
      )}
    >
      <Icon className="size-3 shrink-0" />
      <span className="min-w-0 truncate font-montserrat text-xs font-medium">{ui.label}</span>
    </span>
  );
}
