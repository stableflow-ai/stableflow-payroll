import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconArrowDown } from "@/components/icons/arrow-down";
import { IconLoading } from "@/components/icons/loading";
import { cn } from "@/lib/utils";
import {
  FLOATING_ALIGN,
  FLOATING_SIDE,
  useFloatingPosition,
} from "@/components/ui/overlay/use-floating-position";
import { DROPDOWN_LOADING } from "./config";

export type DropdownOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

export type DropdownProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: DropdownOption[];
  label?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  triggerClassName?: string;
  panelClassName?: string;
  empty?: ReactNode;
  renderOption?: (option: DropdownOption, selected: boolean) => ReactNode;
};

export function Dropdown(props: DropdownProps) {
  const {
    value,
    defaultValue,
    onChange,
    options,
    label,
    placeholder = "Select",
    disabled = false,
    loading = false,
    className,
    triggerClassName,
    panelClassName,
    empty = "No options",
    renderOption,
  } = props;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [triggerWidth, setTriggerWidth] = useState<number>();
  const selectedValue = value ?? uncontrolledValue;
  const panelStyle = useFloatingPosition({
    open,
    triggerRef,
    panelRef,
    side: FLOATING_SIDE.Bottom,
    align: FLOATING_ALIGN.Start,
    offset: 6,
  });

  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedValue),
    [options, selectedValue],
  );

  const close = () => setOpen(false);

  const selectValue = (nextValue: string) => {
    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }
    onChange?.(nextValue);
    close();
  };

  useLayoutEffect(() => {
    if (!open) return;
    const width = triggerRef.current?.getBoundingClientRect().width;
    if (width) setTriggerWidth(width);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onScroll = () => close();
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <div className={cn("relative inline-block min-w-0", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
        className={cn(
          "inline-flex h-9 w-full min-w-0 items-center justify-between gap-2 overflow-hidden rounded-[6px] border border-[#E3E3E3] bg-white px-3 font-montserrat text-sm font-medium text-black outline-none",
          disabled && "cursor-not-allowed opacity-30",
          triggerClassName,
        )}
      >
        {label ? <span className="min-w-0 shrink truncate text-[#aaa]">{label}</span> : null}
        <span
          className={cn(
            "flex min-w-0 items-center gap-2 truncate",
            label && "flex-1 justify-end text-right",
            !selectedOption && "text-[#606060]",
          )}
        >
          {loading ? (
            <IconLoading className="size-3.25 shrink-0 animate-spin text-[#909090]" />
          ) : null}
          <span className="min-w-0 truncate">{selectedOption?.label ?? placeholder}</span>
        </span>
        <IconArrowDown
          className={cn(
            "h-1.5 w-2.75 shrink-0 text-black transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              role="listbox"
              style={{ ...panelStyle, minWidth: triggerWidth }}
              className={cn(
                "z-1100 w-max overflow-hidden rounded-[12px] border border-[#E0E0E0] bg-[#FDFDFD] py-1 font-montserrat text-base font-medium leading-normal text-black shadow-[0_0_20px_0_rgba(0,0,0,0.06)]",
                panelClassName,
              )}
            >
              {loading ? (
                <p
                  role="status"
                  className="flex items-center justify-center gap-2 px-3 py-4 font-montserrat text-sm font-medium text-[#aaa]"
                >
                  <IconLoading className="size-3.25 shrink-0 animate-spin" />
                  {DROPDOWN_LOADING}
                </p>
              ) : options.length === 0 ? (
                <p
                  role="status"
                  className="px-3 py-4 text-center font-montserrat text-sm font-medium text-[#aaa]"
                >
                  {empty}
                </p>
              ) : (
                options.map((option) => {
                  const selected = option.value === selectedValue;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      disabled={option.disabled}
                      onClick={() => {
                        if (option.disabled) return;
                        selectValue(option.value);
                      }}
                      className={cn(
                        "flex w-full text-left text-xs font-medium text-black hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30",
                        renderOption ? "items-center px-2.5 py-1.5" : "px-3 py-2",
                        selected && "bg-black/5",
                      )}
                    >
                      {renderOption ? renderOption(option, selected) : option.label}
                    </button>
                  );
                })
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default Dropdown;
