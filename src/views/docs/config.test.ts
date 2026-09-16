import { describe, expect, it } from "vitest";
import { DOCS_TOC_IDS, isDocsTocId } from "./config";

describe("docs toc ids", () => {
  it("accepts heading ids from the user guide", () => {
    expect(isDocsTocId("1-platform-overview")).toBe(true);
    expect(isDocsTocId("43-payment-by-form")).toBe(true);
    expect(isDocsTocId("missing")).toBe(false);
  });

  it("lists every nested heading", () => {
    expect(DOCS_TOC_IDS[0]).toBe("1-platform-overview");
    expect(DOCS_TOC_IDS).toContain("93-limits-chains-and-notes");
    expect(DOCS_TOC_IDS.length).toBeGreaterThan(20);
  });
});
