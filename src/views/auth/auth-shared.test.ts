import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { isGoogleUnregisteredError } from "./auth-shared";
import { GOOGLE_UNREGISTERED_CODE } from "./config";

describe("isGoogleUnregisteredError", () => {
  it("matches envelope code 10008", () => {
    expect(isGoogleUnregisteredError(new ApiError("not registered", 200, GOOGLE_UNREGISTERED_CODE))).toBe(true);
    expect(isGoogleUnregisteredError(new ApiError("nope", 400, "400"))).toBe(false);
    expect(isGoogleUnregisteredError(new Error("nope"))).toBe(false);
  });
});
