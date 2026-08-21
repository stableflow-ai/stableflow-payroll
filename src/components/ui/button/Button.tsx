import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { IconLoading } from "@/components/icons/loading";
import { cn } from "@/lib/utils";
import { BUTTON_SIZE, BUTTON_VARIANT } from "./config";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 px-5 text-center font-montserrat font-medium leading-normal transition-colors transition-opacity outline-none select-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-30",
  {
    variants: {
      variant: {
        [BUTTON_VARIANT.Primary]:
          "border border-transparent bg-black text-white shadow-[0_0_6px_0_rgba(0,0,0,0.06)] hover:opacity-90",
        [BUTTON_VARIANT.Normal]:
          "border border-[rgba(0,0,0,0.20)] bg-white text-[#606060] shadow-[0_0_6px_0_rgba(0,0,0,0.06)] hover:bg-black/5",
      },
      size: {
        [BUTTON_SIZE.Xl]: "h-14 rounded-[12px] text-base",
        [BUTTON_SIZE.Lg]: "h-[50px] rounded-[12px] text-base",
        [BUTTON_SIZE.Md]: "h-10 rounded-[10px] text-base",
        [BUTTON_SIZE.Sm]: "h-9 rounded-[8px] text-sm",
      },
    },
    defaultVariants: {
      variant: BUTTON_VARIANT.Primary,
      size: BUTTON_SIZE.Md,
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    rounded?: string;
  };

export function Button(props: ButtonProps) {
  const {
    className,
    variant = BUTTON_VARIANT.Primary,
    size = BUTTON_SIZE.Md,
    loading = false,
    rounded,
    disabled,
    children,
    type = "button",
    ...restProps
  } = props;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), rounded, className)}
      {...restProps}
    >
      {loading ? <IconLoading className="size-3.25 shrink-0 animate-spin" /> : null}
      {children}
    </button>
  );
}

export { buttonVariants };
export default Button;
