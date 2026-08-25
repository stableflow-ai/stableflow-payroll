import { describe, expect, it } from "vitest";
import { endOfDay, startOfDay } from "date-fns";
import {
  calendarRangeFromPicks,
  formatDateRangeLabel,
  lastNDaysRange,
} from "./utils";

describe("calendarRangeFromPicks", () => {
  it("commits a single calendar day when start and end are the same day", () => {
    const day = new Date(2026, 7, 20, 15, 30);
    const range = calendarRangeFromPicks(day, day);
    expect(range.from).toEqual(startOfDay(day));
    expect(range.to).toEqual(endOfDay(day));
  });

  it("orders a multi-day range from the earlier date", () => {
    const start = new Date(2026, 7, 22);
    const end = new Date(2026, 7, 20);
    const range = calendarRangeFromPicks(start, end);
    expect(range.from).toEqual(startOfDay(end));
    expect(range.to).toEqual(endOfDay(start));
  });
});

describe("formatDateRangeLabel", () => {
  const now = new Date(2026, 7, 25, 12);

  it("keeps the Last 1 day preset label", () => {
    expect(formatDateRangeLabel(lastNDaysRange(1, now), now)).toBe("Last 1 day");
  });

  it("shows a single date for a custom one-day range", () => {
    const day = new Date(2026, 6, 4);
    expect(formatDateRangeLabel({
      from: startOfDay(day),
      to: endOfDay(day),
    }, now)).toBe("Jul 4, 2026");
  });
});
