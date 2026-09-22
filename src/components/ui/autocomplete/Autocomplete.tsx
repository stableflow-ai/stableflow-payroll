import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconLoading } from "@/components/icons/loading";
import { cn } from "@/lib/utils";
import { floatingLayerZIndex } from "@/components/ui/overlay/stack";
import {
  FLOATING_ALIGN,
  FLOATING_SIDE,
  useFloatingPosition,
} from "@/components/ui/overlay/use-floating-position";
import { AUTOCOMPLETE_EMPTY, AUTOCOMPLETE_LOADING } from "./config";

export type AutocompleteOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

export type AutocompleteProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  options: AutocompleteOption[];
  onSelect: (value: string) => void;
  value?: string;
  loading?: boolean;
  empty?: ReactNode;
  className?: string;
  panelClassName?: string;
  children: ReactNode;
  renderOption?: (option: AutocompleteOption, active: boolean) => ReactNode;
};

function optionValuesKey(options: readonly AutocompleteOption[]): string {
  return options.map((option) => option.value).join("\0");
}

function nextEnabledIndex(
  options: readonly AutocompleteOption[],
  from: number,
  direction: 1 | -1,
): number {
  const enabled: number[] = [];
  for (let index = 0; index < options.length; index += 1) {
    if (!options[index]?.disabled) enabled.push(index);
  }
  if (enabled.length === 0) return -1;
  if (from < 0) return direction === 1 ? enabled[0]! : enabled[enabled.length - 1]!;
  const position = enabled.indexOf(from);
  if (position < 0) return direction === 1 ? enabled[0]! : enabled[enabled.length - 1]!;
  const next = (position + direction + enabled.length) % enabled.length;
  return enabled[next]!;
}

export function Autocomplete(props: AutocompleteProps) {
  const {
    open,
    onOpenChange,
    options,
    onSelect,
    value,
    loading = false,
    empty = AUTOCOMPLETE_EMPTY,
    className,
    panelClassName,
    children,
    renderOption,
  } = props;
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const optionsRef = useRef(options);
  const onSelectRef = useRef(onSelect);
  const onOpenChangeRef = useRef(onOpenChange);
  const activeIndexRef = useRef(-1);
  const [triggerWidth, setTriggerWidth] = useState<number>();
  const [activeIndex, setActiveIndex] = useState(-1);
  const optionsKey = optionValuesKey(options);
  const panelStyle = useFloatingPosition({
    open,
    triggerRef,
    panelRef,
    side: FLOATING_SIDE.Bottom,
    align: FLOATING_ALIGN.Start,
    offset: 6,
  });

  optionsRef.current = options;
  onSelectRef.current = onSelect;
  onOpenChangeRef.current = onOpenChange;

  const setActive = (index: number) => {
    activeIndexRef.current = index;
    setActiveIndex(index);
  };

  const close = () => onOpenChangeRef.current?.(false);

  const selectIndex = (index: number) => {
    const option = optionsRef.current[index];
    if (!option || option.disabled) return;
    onSelectRef.current(option.value);
    close();
  };

  useLayoutEffect(() => {
    if (!open) return;
    const width = triggerRef.current?.getBoundingClientRect().width;
    if (width) setTriggerWidth(width);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setActive(-1);
      return;
    }
    const match = value != null
      ? optionsRef.current.findIndex((option) => option.value === value)
      : -1;
    setActive(match);
  }, [open, optionsKey, value]);

  useLayoutEffect(() => {
    if (!open || activeIndex < 0) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

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
      if (event.key === "Escape") {
        close();
        return;
      }
      if (loading || optionsRef.current.length === 0) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive(nextEnabledIndex(optionsRef.current, activeIndexRef.current, 1));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(nextEnabledIndex(optionsRef.current, activeIndexRef.current, -1));
        return;
      }
      if (event.key === "Enter") {
        const index = activeIndexRef.current;
        if (index < 0) return;
        event.preventDefault();
        selectIndex(index);
      }
    };
    const onScroll = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && panelRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [loading, open]);

  return (
    <div className={cn("relative min-w-0", className)}>
      <div
        ref={triggerRef}
        className="min-w-0 w-full"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-activedescendant={
          open && activeIndex >= 0 ? `autocomplete-option-${activeIndex}` : undefined
        }
      >
        {children}
      </div>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              role="listbox"
              style={{
                ...panelStyle,
                minWidth: triggerWidth,
                zIndex: floatingLayerZIndex(),
              }}
              className={cn(
                "max-h-60 w-max overflow-y-auto overflow-x-hidden rounded-[12px] border border-[#E0E0E0] bg-[#FDFDFD] py-1 font-montserrat text-base font-medium leading-normal text-black shadow-[0_0_20px_0_rgba(0,0,0,0.06)]",
                panelClassName,
              )}
            >
              {loading ? (
                <p
                  role="status"
                  className="flex items-center justify-center gap-2 px-3 py-4 font-montserrat text-sm font-medium text-[#aaa]"
                >
                  <IconLoading className="size-3.25 shrink-0 animate-spin" />
                  {AUTOCOMPLETE_LOADING}
                </p>
              ) : options.length === 0 ? (
                <p
                  role="status"
                  className="px-3 py-4 text-center font-montserrat text-sm font-medium text-[#aaa]"
                >
                  {empty}
                </p>
              ) : (
                options.map((option, index) => {
                  const active = index === activeIndex;
                  return (
                    <button
                      key={option.value}
                      id={`autocomplete-option-${index}`}
                      ref={(node) => {
                        optionRefs.current[index] = node;
                      }}
                      type="button"
                      role="option"
                      aria-selected={active}
                      disabled={option.disabled}
                      onMouseEnter={() => {
                        if (option.disabled) return;
                        setActive(index);
                      }}
                      onClick={() => {
                        if (option.disabled) return;
                        selectIndex(index);
                      }}
                      className={cn(
                        "flex w-full text-left text-xs font-medium text-black hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30",
                        renderOption ? "items-center px-2.5 py-1.5" : "px-3 py-2",
                        active && "bg-black/5",
                      )}
                    >
                      {renderOption ? renderOption(option, active) : option.label}
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
