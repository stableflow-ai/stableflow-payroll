import { describe, expect, it } from "vitest";
import {
  catalogToCategoryItem,
  categoryHistoryPath,
  categoryPath,
  isCategoryNavEnabled,
  isCategoryPath,
  operationImportCsvFilename,
  payCategoryFromPath,
} from "./config";

describe("payCategoryFromPath", () => {
  it("reads API category segments and history", () => {
    expect(payCategoryFromPath("/pay/office")).toBe("office");
    expect(payCategoryFromPath("/pay/office/history")).toBe("office");
    expect(payCategoryFromPath("/pay/kolmkt")).toBe("kolmkt");
    expect(payCategoryFromPath("/pay/payroll")).toBeNull();
    expect(payCategoryFromPath("/pay/form")).toBeNull();
    expect(payCategoryFromPath("/pay/office/extra")).toBeNull();
    expect(isCategoryPath("/pay/grants")).toBe(true);
    expect(isCategoryPath("/pay/expense")).toBe(false);
    expect(categoryPath("office")).toBe("/pay/office");
    expect(categoryHistoryPath("office")).toBe("/pay/office/history");
    expect(operationImportCsvFilename("office")).toBe("office-import-template.csv");
    expect(operationImportCsvFilename("kolmkt")).toBe("kolmkt-import-template.csv");
  });
});

describe("catalogToCategoryItem", () => {
  it("falls back to local art and nav enabled status", () => {
    const item = catalogToCategoryItem({
      id: 1,
      category: "office",
      name: "Office operation",
      icon: "https://example.com/office.png",
      description: "Rent",
      added: true,
      status: "active",
    });
    expect(item.operationId).toBe(1);
    expect(item.title).toBe("Office operation");
    expect(item.iconSrc).toBe("https://example.com/office.png");
    expect(item.previewSrc).toContain("preview-office-operation");
    expect(isCategoryNavEnabled(item)).toBe(true);
    expect(
      isCategoryNavEnabled({
        ...item,
        added: true,
        status: "disabled",
      }),
    ).toBe(false);
  });
});
