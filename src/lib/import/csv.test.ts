import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadCsvFile, unparseCsv } from "./csv";

describe("unparseCsv", () => {
  it("writes header and rows", () => {
    expect(
      unparseCsv([
        ["name", "amount"],
        ["Alice", "1"],
      ]),
    ).toBe("name,amount\r\nAlice,1");
  });
});

describe("downloadCsvFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("triggers a csv download", () => {
    const click = vi.fn();
    const link = { href: "", download: "", click };
    const createElement = vi.fn(() => link);
    vi.stubGlobal("document", { createElement });
    const createObjectURL = vi.fn(() => "blob:csv");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    downloadCsvFile("name,amount\nAlice,1", "template.csv");

    expect(createElement).toHaveBeenCalledWith("a");
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(link.href).toBe("blob:csv");
    expect(link.download).toBe("template.csv");
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:csv");
  });
});
