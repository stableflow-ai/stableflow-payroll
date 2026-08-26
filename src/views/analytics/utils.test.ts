import { describe, expect, it } from "vitest";
import { volumeChangePercent, withVolumeChangePercents } from "./utils";

describe("volumeChangePercent", () => {
  it("returns a rounded percent change", () => {
    expect(volumeChangePercent(112, 100)).toBe(12);
    expect(volumeChangePercent(46.5, 72.2)).toBe(-36);
    expect(volumeChangePercent(50, 50)).toBe(0);
  });

  it("returns null when the previous value is 0", () => {
    expect(volumeChangePercent(100, 0)).toBeNull();
    expect(volumeChangePercent(0, 0)).toBeNull();
  });
});

describe("withVolumeChangePercents", () => {
  it("returns null change for a single bar", () => {
    expect(withVolumeChangePercents([{ label: "Aug", value: 100 }])).toEqual([
      { label: "Aug", value: 100, changePercent: null },
    ]);
  });

  it("returns null change for an empty list", () => {
    expect(withVolumeChangePercents([])).toEqual([]);
  });

  it("omits the first bar and labels later bars vs the previous", () => {
    expect(
      withVolumeChangePercents([
        { label: "Mar", value: 100 },
        { label: "Apr", value: 65 },
        { label: "May", value: 73 },
      ]),
    ).toEqual([
      { label: "Mar", value: 100, changePercent: null },
      { label: "Apr", value: 65, changePercent: -35 },
      { label: "May", value: 73, changePercent: 12 },
    ]);
  });
});
