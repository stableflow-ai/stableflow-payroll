import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { formatQuoteErrorMessage, stampDownloadFilename } from "./utils";

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

describe("stampDownloadFilename", () => {
  const now = new Date(2026, 7, 25, 14, 25, 9);

  it("inserts a timestamp before the extension", () => {
    expect(stampDownloadFilename("transaction-history.csv", now)).toBe(
      "transaction-history-20260825-142509.csv",
    );
  });

  it("appends a timestamp when there is no extension", () => {
    expect(stampDownloadFilename("export", now)).toBe("export-20260825-142509");
  });
});
