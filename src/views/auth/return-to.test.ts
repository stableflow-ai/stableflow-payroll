import { describe, expect, it } from "vitest";
import {
  loginPathWithReturnTo,
  registerPathWithReturnTo,
  returnToFromSearch,
  safeReturnTo,
} from "./return-to";

describe("safeReturnTo", () => {
  it("accepts in-app relative paths including search", () => {
    expect(safeReturnTo("/pay?addr=0x1&amount=1")).toBe("/pay?addr=0x1&amount=1");
    expect(safeReturnTo(encodeURIComponent("/pay?addr=0x1"))).toBe("/pay?addr=0x1");
  });

  it("rejects open redirects and auth routes", () => {
    expect(safeReturnTo("https://evil.test/pay")).toBeNull();
    expect(safeReturnTo("//evil.test")).toBeNull();
    expect(safeReturnTo("/login")).toBeNull();
    expect(safeReturnTo("/register?x=1")).toBeNull();
    expect(safeReturnTo("")).toBeNull();
  });
});

describe("auth links", () => {
  it("encodes returnTo on login and register paths", () => {
    expect(loginPathWithReturnTo("/pay?a=1")).toBe("/login?returnTo=%2Fpay%3Fa%3D1");
    expect(registerPathWithReturnTo("/pay?a=1")).toBe("/register?returnTo=%2Fpay%3Fa%3D1");
    expect(loginPathWithReturnTo(null)).toBe("/login");
  });

  it("reads returnTo from a search string", () => {
    expect(returnToFromSearch("returnTo=%2Fpay%3Faddr%3D1")).toBe("/pay?addr=1");
  });
});
