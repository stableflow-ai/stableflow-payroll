import { useState } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";
import { SWITCH_THUMB_TRAVEL_PX, SWITCH_TRACK_OFF_BG, SWITCH_TRACK_ON_BG } from "./config";

export type SwitchProps = Omit<
  HTMLMotionProps<"button">,
  "onChange" | "role" | "aria-checked" | "children" | "animate" | "initial" | "transition"
> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function Switch(props: SwitchProps) {
  const {
    checked,
    defaultChecked = false,
    onCheckedChange,
    disabled,
    className,
    type = "button",
    onClick,
    ...restProps
  } = props;
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
  const isChecked = checked ?? uncontrolledChecked;

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
      disabled={disabled}
      initial={false}
      animate={{ backgroundColor: isChecked ? SWITCH_TRACK_ON_BG : SWITCH_TRACK_OFF_BG }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        toggle();
      }}
      className={cn(
        "relative h-5 w-[34px] p-[1px] shrink-0 cursor-pointer rounded-full border border-[#e3e3e3] outline-none select-none",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-30",
        className,
      )}
      {...restProps}
    >
      <motion.span
        aria-hidden
        initial={false}
        animate={{ x: isChecked ? SWITCH_THUMB_TRAVEL_PX : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="absolute top-[1px] left-[1px] block size-4 rounded-full border border-[#d9d9d9] bg-white"
      />
    </motion.button>
  );
}

export default Switch;
