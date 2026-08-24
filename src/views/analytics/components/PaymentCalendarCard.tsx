import { useMemo } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import { Card } from "@/components/ui/card/Card";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { DATE_FORMAT, formatAmount, formatDate } from "@/utils";
import { cn } from "@/lib/utils";
import type { CalendarDay } from "@/mocks/analytics";
import { CALENDAR_PAYOUT_BG, WEEKDAY_LABELS } from "../config";

function monthStart(month: string) {
  return startOfMonth(parseISO(`${month}-01`));
}

export function PaymentCalendarCard(props: {
  month: string;
  days: CalendarDay[];
}) {
  const { month, days } = props;
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    for (const day of days) map.set(day.date, day);
    return map;
  }, [days]);

  const cells = useMemo(() => {
    const start = monthStart(month);
    const end = endOfMonth(start);
    const weekday = (start.getDay() + 6) % 7;
    const leading = Array.from({ length: weekday }, () => null);
    const monthDays = eachDayOfInterval({ start, end });
    const trailingCount = (7 - ((leading.length + monthDays.length) % 7)) % 7;
    const trailing = Array.from({ length: trailingCount }, () => null);
    return [...leading, ...monthDays, ...trailing];
  }, [month]);

  return (
    <Card className="flex min-h-[356px] flex-col">
      <h2 className="font-montserrat text-lg font-medium capitalize text-black">
        Payment calendar
      </h2>
      <div className="mt-4 grid grid-cols-7 gap-y-2 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <span
            key={label}
            className="font-montserrat text-sm font-medium uppercase text-[#aaa]"
          >
            {label}
          </span>
        ))}
        {cells.map((date, index) => {
          if (!date) {
            return <span key={`empty-${index}`} />;
          }
          const key = format(date, "yyyy-MM-dd");
          const payout = byDate.get(key);
          const dayButton = (
            <span
              className={cn(
                "mx-auto grid size-[29px] place-items-center rounded-full font-montserrat text-sm font-semibold text-[#606060]",
                payout && "text-black",
              )}
              style={payout ? { backgroundColor: CALENDAR_PAYOUT_BG } : undefined}
            >
              {format(date, "d")}
            </span>
          );

          if (!payout) {
            return <span key={key}>{dayButton}</span>;
          }

          return (
            <Tooltip
              key={key}
              className="w-[237px]"
              content={
                <div className="flex flex-col gap-2.5 font-montserrat text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span>Payout Date</span>
                    <span className="font-medium">
                      {formatDate(parseISO(payout.date), DATE_FORMAT.MonthDayYear)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Payment Value</span>
                    <span className="font-medium">
                      {formatAmount(payout.paymentUsd)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Payouts</span>
                    <span className="font-medium">{payout.payouts}</span>
                  </div>
                </div>
              }
            >
              {dayButton}
            </Tooltip>
          );
        })}
      </div>
    </Card>
  );
}
