import { useState } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { IconLoading } from "@/components/icons/loading";
import { cn } from "@/lib/utils";
import { SWITCH_THUMB_TRAVEL_PX, SWITCH_TRACK_OFF_BG, SWITCH_TRACK_ON_BG } from "./config";

export type SwitchProps = Omit<
  HTMLMotionProps<"button">,
  "onChange" | "role" | "aria-checked" | "children" | "animate" | "initial" | "transition"
> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  loading?: boolean;
};

export function Switch(props: SwitchProps) {
  const {
    checked,
    defaultChecked = false,
    onCheckedChange,
    disabled,
    loading = false,
    className,
    type = "button",
    onClick,
    ...restProps
  } = props;
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
  const isChecked = checked ?? uncontrolledChecked;
  const isDisabled = Boolean(disabled);

  const toggle = () => {
    const nextChecked = !isChecked;
    if (checked === undefined) {
      setUncontrolledChecked(nextChecked);
    }
    onCheckedChange?.(nextChecked);
  };

  return (
    <motion.button
      type={type}
      role="switch"
      aria-checked={isChecked}
      aria-busy={loading || undefined}
      disabled={isDisabled || loading}
      initial={false}
      animate={{ backgroundColor: isChecked ? SWITCH_TRACK_ON_BG : SWITCH_TRACK_OFF_BG }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || loading || isDisabled) return;
        toggle();
      }}
      className={cn(
        "relative h-5 w-[34px] p-[1px] shrink-0 cursor-pointer rounded-full border border-[#e3e3e3] outline-none select-none",
        (isDisabled || loading) && "pointer-events-none cursor-not-allowed",
        isDisabled && "opacity-30",
        loading && "opacity-100",
        className,
      )}
      {...restProps}
    >
      <motion.span
        aria-hidden
        initial={false}
        animate={{ x: isChecked ? SWITCH_THUMB_TRAVEL_PX : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={cn(
          "absolute top-[1px] left-[1px] flex size-4 items-center justify-center",
          loading
            ? "rounded-full bg-white/75"
            : "rounded-full border border-[#d9d9d9] bg-white",
        )}
      >
        {loading ? (
          <IconLoading className="size-3.25 shrink-0 animate-spin text-[#909090]" />
        ) : null}
      </motion.span>
    </motion.button>
  );
}

export default Switch;
