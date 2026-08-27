import { describe, expect, it } from "vitest";
import { tokenBalanceUsd } from "./utils";

describe("tokenBalanceUsd", () => {
  it("multiplies balance by price", () => {
    expect(tokenBalanceUsd({ price: 4000 }, "0.05")).toBe(200);
    expect(tokenBalanceUsd({ price: 1 }, "100")).toBe(100);
  });

  it("returns -1 for unknown balance", () => {
    expect(tokenBalanceUsd({ price: 1 }, null)).toBe(-1);
    expect(tokenBalanceUsd({ price: 1 }, undefined)).toBe(-1);
    expect(tokenBalanceUsd({ price: 1 }, "—")).toBe(-1);
  });

  it("returns 0 for a zero balance", () => {
    expect(tokenBalanceUsd({ price: 1 }, "0")).toBe(0);
  });

  it("treats a non-finite price as 0", () => {
    expect(tokenBalanceUsd({ price: Number.NaN }, "10")).toBe(0);
  });
});
