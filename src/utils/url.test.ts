import { describe, expect, it } from "vitest";
import { isHttpUrl, splitHttpUrls } from "./url";

describe("isHttpUrl", () => {
  it("accepts http and https", () => {
    expect(isHttpUrl("https://example.com/path")).toBe(true);
    expect(isHttpUrl("http://example.com")).toBe(true);
  });

  it("rejects javascript and relative paths", () => {
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("data:text/html,hi")).toBe(false);
    expect(isHttpUrl("/local")).toBe(false);
  });
});

describe("splitHttpUrls", () => {
  it("returns the original text when there is no url", () => {
    expect(splitHttpUrls("Invoice of conference.pdf")).toEqual([
      { type: "text", value: "Invoice of conference.pdf" },
    ]);
  });

  it("splits http(s) urls from surrounding text", () => {
    expect(splitHttpUrls("See https://example.com/a and http://foo.test.")).toEqual([
      { type: "text", value: "See " },
      { type: "url", value: "https://example.com/a" },
      { type: "text", value: " and " },
      { type: "url", value: "http://foo.test" },
      { type: "text", value: "." },
    ]);
  });

  it("ignores javascript urls", () => {
    expect(splitHttpUrls("javascript:alert(1)")).toEqual([
      { type: "text", value: "javascript:alert(1)" },
    ]);
  });

  it("splits urls separated by a comma", () => {
    expect(splitHttpUrls("https://a.example/x.pdf,https://b.example/y.pdf")).toEqual([
      { type: "url", value: "https://a.example/x.pdf" },
      { type: "text", value: "," },
      { type: "url", value: "https://b.example/y.pdf" },
    ]);
  });

  it("splits a second url glued after text", () => {
    expect(
      splitHttpUrls("https://a.example/x.pdf,notehttps://b.example/y.pdf"),
    ).toEqual([
      { type: "url", value: "https://a.example/x.pdf" },
      { type: "text", value: ",note" },
      { type: "url", value: "https://b.example/y.pdf" },
    ]);
  });
});
