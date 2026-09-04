import { describe, expect, it } from "vitest";
import { VOLUME_PERIOD } from "@/types/payout";
import { CHART_METRIC } from "./config";
import {
  adminChartPoints,
  emptyAdminChartBuckets,
  emptyVolumeBuckets,
  formatAdminChartAxis,
  greetingName,
  volumeChartPoints,
} from "./utils";

describe("greetingName", () => {
  it("uses the first word of the display name", () => {
    expect(greetingName("Andrew Chen")).toBe("Andrew");
    expect(greetingName("Andrew")).toBe("Andrew");
    expect(greetingName("  ")).toBe("");
  });
});

describe("volumeChartPoints", () => {
  it("keeps provided series and fills empty periods with zero buckets", () => {
    const now = new Date("2026-09-04T00:00:00.000Z");
    const series = [{ label: "Jul", income: 10, payout: 1, incomeTx: 1, payoutTx: 1 }];
    expect(volumeChartPoints(VOLUME_PERIOD.Monthly, series, now)).toEqual(series);

    const empty = emptyVolumeBuckets(VOLUME_PERIOD.Daily, now);
    expect(empty).toHaveLength(7);
    expect(empty.every((point) => point.income === 0 && point.payout === 0)).toBe(true);
    expect(volumeChartPoints(VOLUME_PERIOD.Daily, [], now)).toEqual(empty);
  });
});

describe("adminChartPoints", () => {
  it("keeps provided series and fills empty periods with zero buckets", () => {
    const now = new Date("2026-09-04T00:00:00.000Z");
    const series = [{ label: "Jul", volume: 100, transaction: 2 }];
    expect(adminChartPoints(VOLUME_PERIOD.Monthly, series, now)).toEqual(series);

    const empty = emptyAdminChartBuckets(VOLUME_PERIOD.Daily, now);
    expect(empty).toHaveLength(7);
    expect(empty.every((point) => point.volume === 0 && point.transaction === 0)).toBe(true);
    expect(adminChartPoints(VOLUME_PERIOD.Daily, [], now)).toEqual(empty);
  });
});

describe("formatAdminChartAxis", () => {
  it("formats volume as compact USD and transactions as integers", () => {
    expect(formatAdminChartAxis(0, CHART_METRIC.Volume)).toBe("$0");
    expect(formatAdminChartAxis(20000, CHART_METRIC.Volume)).toBe("$20K");
    expect(formatAdminChartAxis(12, CHART_METRIC.Transaction)).toBe("12");
  });
});
