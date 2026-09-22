import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { abortOnQuoteDeadline } from "./quote-deadline";

describe("abortOnQuoteDeadline", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-18T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does nothing when the deadline is missing or invalid", () => {
    const abort = vi.fn();
    abortOnQuoteDeadline(undefined, abort);
    abortOnQuoteDeadline("", abort);
    abortOnQuoteDeadline("not-a-date", abort);
    expect(abort).not.toHaveBeenCalled();
  });

  it("aborts immediately when the deadline has passed", () => {
    const abort = vi.fn();
    const stop = abortOnQuoteDeadline("2026-09-18T11:59:59.000Z", abort);
    expect(abort).toHaveBeenCalledOnce();
    stop();
  });

  it("aborts when the deadline is reached", () => {
    const abort = vi.fn();
    abortOnQuoteDeadline("2026-09-18T12:00:01.000Z", abort);
    expect(abort).not.toHaveBeenCalled();
    vi.advanceTimersByTime(999);
    expect(abort).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(abort).toHaveBeenCalledOnce();
  });

  it("does not abort after cleanup", () => {
    const abort = vi.fn();
    const stop = abortOnQuoteDeadline("2026-09-18T12:00:01.000Z", abort);
    stop();
    vi.advanceTimersByTime(2_000);
    expect(abort).not.toHaveBeenCalled();
  });
});
