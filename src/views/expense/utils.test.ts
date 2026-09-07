import { describe, expect, it } from "vitest";
import { EXPENSE_TOTAL_PAYOUT_PERIOD } from "@/types/expense";
import { mapExpenseChartSeries, parseExpenseImportRows } from "./utils";

describe("mapExpenseChartSeries", () => {
  it("labels months and highlights the last non-zero point", () => {
    const series = mapExpenseChartSeries(
      [
        { time: "2026-06-15T00:00:00Z", volume: "4300" },
        { time: "2026-07-15T00:00:00Z", volume: "0" },
        { time: "2026-08-15T00:00:00Z", volume: "3100" },
      ],
      EXPENSE_TOTAL_PAYOUT_PERIOD.Month,
    );
    expect(series.currentValue).toBe("3100");
    expect(series.periodLabel).toBe("August, 2026");
    expect(series.points.map((point) => point.label)).toEqual(["Jun", "Jul", "Aug"]);
    expect(series.points[2]?.highlighted).toBe(true);
  });

  it("labels day and week points with month and day", () => {
    const series = mapExpenseChartSeries(
      [{ time: "2026-08-07T12:00:00Z", volume: "200" }],
      EXPENSE_TOTAL_PAYOUT_PERIOD.Day,
    );
    expect(series.periodLabel).toBe("August 7, 2026");
    expect(series.points[0]?.label).toBe("Aug 7");
  });

  it("falls back to zero when there are no points", () => {
    expect(mapExpenseChartSeries([])).toEqual({
      points: [],
      periodLabel: "",
      currentValue: "0",
    });
  });
});

describe("parseExpenseImportRows", () => {
  it("reads named headers including purpose and description", () => {
    const { rows, truncated } = parseExpenseImportRows([
      ["name", "recipient", "email", "amount", "token", "network", "purpose", "description"],
      [
        "Andrew",
        "0x557be3f47a45499385f60cd64e2ff455e42a3311",
        "alice@example.com",
        "800",
        "USDC",
        "eth",
        "Conference Travel",
        "Invoice of conference.pdf",
      ],
    ]);
    expect(truncated).toBe(false);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: "Andrew",
      address: "0x557be3f47a45499385f60cd64e2ff455e42a3311",
      email: "alice@example.com",
      token: "USDC",
      network: "eth",
      amount: "800",
      purpose: "Conference Travel",
      description: "Invoice of conference.pdf",
    });
  });

  it("returns no rows for an empty file", () => {
    expect(parseExpenseImportRows([])).toEqual({ rows: [], truncated: false });
    expect(
      parseExpenseImportRows([
        ["name", "recipient", "email", "amount", "token", "network", "purpose", "description"],
      ]),
    ).toEqual({ rows: [], truncated: false });
  });
});
