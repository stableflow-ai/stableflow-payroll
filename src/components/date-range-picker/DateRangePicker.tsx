import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { IconArrowDown } from "@/components/icons/arrow-down";
import {
  FLOATING_ALIGN,
  FLOATING_SIDE,
  useFloatingPosition,
} from "@/components/ui/overlay/use-floating-position";
import { cn } from "@/lib/utils";
import { DATE_RANGE_PRESET_OPTIONS, DATE_RANGE_WEEKDAY_LABELS } from "./config";
import {
  calendarRangeFromPicks,
  formatDateRangeLabel,
  lastNDaysRange,
  type DateRangeValue,
} from "./utils";

export function DateRangePicker(props: {
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
  className?: string;
  triggerClassName?: string;
}) {
  const { value, onChange, className, triggerClassName } = props;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(value.to));
  const [draftStart, setDraftStart] = useState<Date | null>(null);
  const panelStyle = useFloatingPosition({
    open,
    triggerRef,
    panelRef,
    side: FLOATING_SIDE.Bottom,
    align: FLOATING_ALIGN.Start,
    offset: 6,
  });

  useEffect(() => {
    if (open) setViewMonth(startOfMonth(value.to));
  }, [open, value.to]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
      setDraftStart(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setDraftStart(null);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    return eachDayOfInterval({
      start: startOfWeek(monthStart),
      end: endOfWeek(endOfMonth(monthStart)),
    });
  }, [viewMonth]);

  const commit = (range: DateRangeValue) => {
    onChange(range);
    setDraftStart(null);
    setOpen(false);
  };

  const pickDay = (day: Date) => {
    if (!draftStart) {
      setDraftStart(day);
      return;
    }
    commit(calendarRangeFromPicks(draftStart, day));
  };

  return (
    <div className={cn("relative inline-block min-w-0", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Select time range"
        onClick={() => {
          setOpen((current) => !current);
          setDraftStart(null);
        }}
        className={cn(
          "inline-flex h-9 w-full min-w-0 items-center justify-between gap-2 overflow-hidden rounded-[6px] border border-[#E3E3E3] bg-white px-3 font-montserrat text-sm font-medium text-black outline-none",
          triggerClassName,
        )}
      >
        <span className="min-w-0 shrink truncate text-[#aaa]">Time</span>
        <span className="min-w-0 flex-1 truncate text-right">{formatDateRangeLabel(value)}</span>
        <IconArrowDown
          className={cn("h-1.5 w-2.75 shrink-0 text-black transition-transform", open && "rotate-180")}
        />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label="Date range"
              style={panelStyle}
              className="z-1100 w-[min(320px,calc(100vw-32px))] rounded-[16px] border border-black/10 bg-white p-4 font-montserrat shadow-[0px_8px_24px_rgba(0,0,0,0.08)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setViewMonth((month) => addMonths(month, -1))}
                  className="inline-flex size-8 items-center justify-center rounded-full hover:bg-black/5"
                >
                  <IconArrowDown className="h-1.5 w-2.75 rotate-90 text-black/60" />
                </button>
                <span className="text-sm font-semibold text-black">{format(viewMonth, "yyyy MMM")}</span>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => setViewMonth((month) => addMonths(month, 1))}
                  className="inline-flex size-8 items-center justify-center rounded-full hover:bg-black/5"
                >
                  <IconArrowDown className="h-1.5 w-2.75 -rotate-90 text-black/60" />
                </button>
              </div>

              <div className="mb-1 grid grid-cols-7 gap-1">
                {DATE_RANGE_WEEKDAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className="text-center text-[11px] font-medium text-[#aaa]"
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const inMonth = isSameMonth(day, viewMonth);
                  const selected =
                    isSameDay(day, value.from)
                    || isSameDay(day, value.to)
                    || (draftStart ? isSameDay(day, draftStart) : false);
                  const inRange =
                    !draftStart
                    && isWithinInterval(day, { start: value.from, end: value.to });
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => pickDay(day)}
                      className={cn(
                        "h-8 rounded-[8px] text-[13px] font-medium transition-colors",
                        !inMonth && "text-[#ccc]",
                        inMonth && !selected && "text-black hover:bg-black/5",
                        inRange && !selected && "bg-black/5",
                        selected && "bg-black text-white",
                      )}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-col gap-1 border-t border-black/10 pt-2">
                {DATE_RANGE_PRESET_OPTIONS.map((option) => (
                  <button
                    key={option.days}
                    type="button"
                    onClick={() => commit(lastNDaysRange(option.days))}
                    className="rounded-[8px] px-2 py-1.5 text-left text-sm font-medium text-black hover:bg-black/5"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
