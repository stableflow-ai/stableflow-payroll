import { describe, expect, it } from "vitest";
import { VOLUME_PERIOD } from "@/types/payout";
import { emptyVolumeBuckets, greetingName, volumeChartPoints } from "./utils";

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
