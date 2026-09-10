import { describe, expect, it } from "vitest";
import {
  mapOperationCatalog,
  mapOperationCatalogItem,
  mapOperationCurrentStats,
  operationImportRequestBody,
} from "./operation";
import { OPERATION_STATUS } from "@/types/operation";

describe("mapOperationCatalogItem", () => {
  it("maps catalog rows and drops missing ids", () => {
    expect(
      mapOperationCatalogItem({
        id: 1,
        category: "office",
        name: "Office operation",
        icon: "https://assets.dapdap.net/payroll/payroll_operation_office.png",
        description: "Rent",
        added: true,
        status: "active",
      }),
    ).toEqual({
      id: 1,
      category: "office",
      name: "Office operation",
      icon: "https://assets.dapdap.net/payroll/payroll_operation_office.png",
      description: "Rent",
      added: true,
      status: OPERATION_STATUS.Active,
    });
    expect(mapOperationCatalogItem({ category: "office" })).toBeNull();
  });
});

describe("mapOperationCatalog", () => {
  it("keeps valid rows from an array", () => {
    const list = mapOperationCatalog([
      { id: 1, category: "office", added: true, status: "active" },
      { id: 2, category: "procurement", added: false, status: "" },
      { name: "skip" },
    ]);
    expect(list.map((item) => item.category)).toEqual(["office", "procurement"]);
    expect(list[1]?.added).toBe(false);
  });
});

describe("mapOperationCurrentStats", () => {
  it("maps totals and change percents", () => {
    expect(
      mapOperationCurrentStats({
        total_payout: "1200",
        total_payout_change: "+10%",
        payouts: 4,
        payouts_change: "-2%",
      }),
    ).toEqual({
      totalPayout: "1200",
      totalChangePercent: 10,
      payouts: 4,
      payoutsChangePercent: -2,
    });
  });
});

describe("operationImportRequestBody", () => {
  it("sends category with the expense import body", () => {
    const body = operationImportRequestBody({
      organizationId: 9,
      category: "office",
      title: "September rent",
      items: [
        {
          name: "Landlord",
          address: "0x1",
          amount: "1",
          network: "eth",
          symbol: "USDC",
        },
      ],
    });
    expect(body.category).toBe("office");
    expect(body.organization_id).toBe(9);
    expect(body.title).toBe("September rent");
  });
});
