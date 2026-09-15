import { describe, expect, it } from "vitest";
import { pickLastHeadingPastOffset } from "./useDocsToc";

describe("pickLastHeadingPastOffset", () => {
  it("keeps the fallback when no heading has crossed the offset", () => {
    expect(
      pickLastHeadingPastOffset(
        [
          { id: "a", top: 400 },
          { id: "b", top: 800 },
        ],
        200,
        "a",
      ),
    ).toBe("a");
  });

  it("selects the last nested heading past the viewport offset", () => {
    expect(
      pickLastHeadingPastOffset(
        [
          { id: "h2", top: 40 },
          { id: "h3-a", top: 80 },
          { id: "h3-b", top: 180 },
          { id: "next-h2", top: 900 },
        ],
        200,
        "h2",
      ),
    ).toBe("h3-b");
  });
});
