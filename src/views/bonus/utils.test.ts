import { describe, expect, it } from "vitest";
import { BONUS_TOTAL_PAYOUT_PERIOD } from "@/types/bonus";
import { fallbackBonusImportName, mapBonusChartSeries, parseBonusImportRows } from "./utils";

describe("mapBonusChartSeries", () => {
  it("labels months and highlights the last non-zero point", () => {
    const series = mapBonusChartSeries(
      [
        { time: "2026-06-15T00:00:00Z", volume: "4300" },
        { time: "2026-07-15T00:00:00Z", volume: "0" },
        { time: "2026-08-15T00:00:00Z", volume: "3100" },
      ],
      BONUS_TOTAL_PAYOUT_PERIOD.Month,
    );
    expect(series.currentValue).toBe("3100");
    expect(series.periodLabel).toBe("August, 2026");
    expect(series.points.map((point) => point.label)).toEqual(["Jun", "Jul", "Aug"]);
    expect(series.points[2]?.highlighted).toBe(true);
  });

  it("labels day and week points with month and day", () => {
    const series = mapBonusChartSeries(
      [{ time: "2026-08-07T12:00:00Z", volume: "200" }],
      BONUS_TOTAL_PAYOUT_PERIOD.Day,
    );
    expect(series.periodLabel).toBe("August 7, 2026");
    expect(series.points[0]?.label).toBe("Aug 7");
  });
});

describe("parseBonusImportRows", () => {
  it("reads email from a named header after recipient", () => {
    const { rows, truncated } = parseBonusImportRows([
      ["recipient", "email", "amount", "token", "network", "memo"],
      ["0x557be3f47a45499385f60cd64e2ff455e42a3311", "alice@example.com", "100", "USDC", "eth", "bonus"],
    ]);
    expect(truncated).toBe(false);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: "alice",
      address: "0x557be3f47a45499385f60cd64e2ff455e42a3311",
      email: "alice@example.com",
      token: "USDC",
      network: "eth",
      amount: "100",
      memo: "bonus",
    });
  });

  it("uses a name column when present", () => {
    const { rows } = parseBonusImportRows([
      ["name", "recipient", "email", "amount", "token", "network", "memo"],
      ["Andrew", "0x557be3f47a45499385f60cd64e2ff455e42a3311", "alice@example.com", "100", "USDC", "eth", ""],
    ]);
    expect(rows[0]?.name).toBe("Andrew");
  });

  it("returns no rows for an empty file", () => {
    expect(parseBonusImportRows([])).toEqual({ rows: [], truncated: false });
    expect(parseBonusImportRows([["recipient", "email", "amount", "token", "network", "memo"]])).toEqual({
      rows: [],
      truncated: false,
    });
  });
});

describe("fallbackBonusImportName", () => {
  it("prefers name, then email local-part, then a shortened address", () => {
    expect(fallbackBonusImportName("Andrew", "alice@example.com", "0x1234567890abcdef1234567890abcdef12345678")).toBe("Andrew");
    expect(fallbackBonusImportName("", "alice@example.com", "0x1234567890abcdef1234567890abcdef12345678")).toBe("alice");
    expect(fallbackBonusImportName("", "", "0x1234567890abcdef1234567890abcdef12345678")).toBe("0x1234...5678");
  });
});
