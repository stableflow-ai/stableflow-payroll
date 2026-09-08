export function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

export function chartYTicks(maxValue: number, divisions = 4): number[] {
  const steps = Math.max(1, Math.floor(divisions));
  const niceMax = niceCeil(maxValue);
  const step = niceMax / steps;
  return Array.from({ length: steps + 1 }, (_, index) => index * step);
}
