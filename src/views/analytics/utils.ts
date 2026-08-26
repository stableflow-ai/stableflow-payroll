import type { VolumePoint } from "@/types/payout";
import type { AnalyticsVolumePoint } from "./config";

export function volumeChangePercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function withVolumeChangePercents(
  points: ReadonlyArray<VolumePoint>,
): AnalyticsVolumePoint[] {
  if (points.length < 2) {
    return points.map((point) => ({
      label: point.label,
      value: point.value,
      changePercent: null,
    }));
  }

  return points.map((point, index, list) => ({
    label: point.label,
    value: point.value,
    changePercent:
      index === 0 ? null : volumeChangePercent(point.value, list[index - 1]?.value ?? 0),
  }));
}
