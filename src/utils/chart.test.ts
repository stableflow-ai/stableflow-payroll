import { describe, expect, it } from "vitest";
import { chartYTicks, niceCeil } from "./chart";

describe("niceCeil", () => {
  it("returns 1 when the value is zero or negative", () => {
    expect(niceCeil(0)).toBe(1);
    expect(niceCeil(-20)).toBe(1);
  });

  it("rounds up to 1, 2, 5, or 10 times a power of ten", () => {
    expect(niceCeil(1)).toBe(1);
    expect(niceCeil(3)).toBe(5);
    expect(niceCeil(200)).toBe(200);
    expect(niceCeil(201)).toBe(500);
    expect(niceCeil(6_000)).toBe(10_000);
    expect(niceCeil(40_000)).toBe(50_000);
    expect(niceCeil(41_000)).toBe(50_000);
  });
});

describe("chartYTicks", () => {
  it("builds even ticks from a nice ceiling of the data max", () => {
    expect(chartYTicks(0, 4)).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(chartYTicks(200, 4)).toEqual([0, 50, 100, 150, 200]);
    expect(chartYTicks(3, 3)).toEqual([0, 5 / 3, 10 / 3, 5]);
    expect(chartYTicks(50_000, 4)).toEqual([0, 12_500, 25_000, 37_500, 50_000]);
  });
});
