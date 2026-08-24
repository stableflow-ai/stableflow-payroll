import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { format, parse } from "date-fns";
import { IconArrowDown } from "@/components/icons/arrow-down";
import { cn } from "@/lib/utils";
import {
  FLOATING_ALIGN,
  FLOATING_SIDE,
  useFloatingPosition,
} from "@/components/ui/overlay/use-floating-position";
import { MONTH_SHORT_LABELS } from "../config";

const MONTH_KEY_PATTERN = /^(\d{4})-(\d{2})$/;

function yearFromMonthKey(monthKey: string): number {
  const match = MONTH_KEY_PATTERN.exec(monthKey);
  return match ? Number(match[1]) : new Date().getFullYear();
}

function monthFromMonthKey(monthKey: string): number | null {
  const match = MONTH_KEY_PATTERN.exec(monthKey);
  return match ? Number(match[2]) : null;
}

function formatMonthLabel(monthKey: string) {
  const match = MONTH_KEY_PATTERN.exec(monthKey);
  if (!match) return monthKey;
  const date = parse(`${match[1]}-${match[2]}-01`, "yyyy-MM-dd", new Date());
  return format(date, "yyyy MMM");
}

export function YearMonthPicker(props: {
  value: string;
  onChange: (monthKey: string) => void;
  className?: string;
  triggerClassName?: string;
}) {
  const { value, onChange, className, triggerClassName } = props;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => yearFromMonthKey(value));
  const panelStyle = useFloatingPosition({
    open,
    triggerRef,
    panelRef,
    side: FLOATING_SIDE.Bottom,
    align: FLOATING_ALIGN.End,
    offset: 8,
  });
  const selectedMonth = monthFromMonthKey(value);
  const selectedYear = yearFromMonthKey(value);

  useEffect(() => {
    setViewYear(yearFromMonthKey(value));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Select month"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex h-9 w-[120px] items-center justify-between gap-3 rounded-[10px] border border-[#e3e3e3] bg-white px-3 font-montserrat text-sm font-medium text-black outline-none",
          triggerClassName,
        )}
      >
        <span className="min-w-0 truncate">{formatMonthLabel(value)}</span>
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
              role="dialog"
              aria-label="Year and month"
              style={panelStyle}
              className="z-1100 w-[280px] rounded-[16px] border border-black/10 bg-white p-4 font-montserrat shadow-[0px_8px_24px_rgba(0,0,0,0.08)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  aria-label="Previous year"
                  onClick={() => setViewYear((year) => year - 1)}
                  className="inline-flex size-8 items-center justify-center rounded-full hover:bg-black/5"
                >
                  <IconArrowDown className="h-1.5 w-2.75 rotate-90 text-black/60" />
                </button>
                <span className="text-sm font-semibold text-black">{viewYear}</span>
                <button
                  type="button"
                  aria-label="Next year"
                  onClick={() => setViewYear((year) => year + 1)}
                  className="inline-flex size-8 items-center justify-center rounded-full hover:bg-black/5"
                >
                  <IconArrowDown className="h-1.5 w-2.75 -rotate-90 text-black/60" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MONTH_SHORT_LABELS.map((label, index) => {
                  const monthNum = index + 1;
                  const monthKey = `${viewYear}-${String(monthNum).padStart(2, "0")}`;
                  const active = selectedYear === viewYear && selectedMonth === monthNum;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        onChange(monthKey);
                        setOpen(false);
                      }}
                      className={cn(
                        "h-9 rounded-[10px] text-[13px] font-medium transition-colors",
                        active ? "bg-black text-white" : "text-black hover:bg-black/5",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
