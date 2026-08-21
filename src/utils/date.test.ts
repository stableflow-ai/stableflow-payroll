import { describe, expect, it } from "vitest";
import { DATE_FORMAT, formatDate, formatTimeAgo } from "./date";

describe("formatDate", () => {
  const iso = "2026-08-01T03:56:00.000Z";

  it("formats month and day", () => {
    expect(formatDate(iso, DATE_FORMAT.MonthDay)).toMatch(/^Aug \d+$/);
  });

  it("formats month, day, and year", () => {
    expect(formatDate(iso, DATE_FORMAT.MonthDayYear)).toMatch(/^Aug \d+, 2026$/);
  });

  it("formats date and time by default", () => {
    expect(formatDate(iso)).toMatch(/^Aug \d+, 2026 \d{2}:\d{2}$/);
  });

  it("returns an empty string for invalid input", () => {
    expect(formatDate("not-a-date")).toBe("");
  });
});

describe("formatTimeAgo", () => {
  const now = new Date("2026-08-21T12:00:00.000Z");

  it("uses seconds under one minute", () => {
    expect(formatTimeAgo("2026-08-21T11:59:15.000Z", now)).toBe("45 s");
  });

  it("pluralizes minutes and hours", () => {
    expect(formatTimeAgo("2026-08-21T11:59:00.000Z", now)).toBe("1 min");
    expect(formatTimeAgo("2026-08-21T11:50:00.000Z", now)).toBe("10 mins");
    expect(formatTimeAgo("2026-08-21T10:00:00.000Z", now)).toBe("2 hours");
  });

  it("uses days, weeks, months, and years", () => {
    expect(formatTimeAgo("2026-08-19T12:00:00.000Z", now)).toBe("2 days");
    expect(formatTimeAgo("2026-08-07T12:00:00.000Z", now)).toBe("2 weeks");
    expect(formatTimeAgo("2026-06-21T12:00:00.000Z", now)).toBe("2 months");
    expect(formatTimeAgo("2024-08-21T12:00:00.000Z", now)).toBe("2 years");
  });
});
