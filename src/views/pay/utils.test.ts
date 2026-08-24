import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { formatQuoteErrorMessage } from "./utils";

describe("formatQuoteErrorMessage", () => {
  it("converts a 1Click minimum amount from minor units", () => {
    const error = new ApiError(
      "Amount is too low for bridge, try at least 18634672511199040",
      400,
    );
    expect(formatQuoteErrorMessage(error, 18)).toBe(
      "Amount is too low for bridge, try at least 0.01863467251119904",
    );
  });
});
