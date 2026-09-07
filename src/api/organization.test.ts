import { describe, expect, it } from "vitest";
import {
  mapOrganizationHighPriorityItems,
  mapOrganizationList,
  mapOrganizationOverview,
  mapOrganizationPayoutPoints,
  pickOrganization,
} from "./organization";
import { ORGANIZATION_HIGH_PRIORITY_CATEGORY } from "@/types/organization";

describe("mapOrganizationOverview", () => {
  it("maps snake_case totals", () => {
    expect(
      mapOrganizationOverview({
        team_members: 8,
        total_payments: 146,
        total_payout: "36520.50",
      }),
    ).toEqual({
      teamMembers: 8,
      totalPayments: 146,
      totalPayout: "36520.50",
    });
  });
});

describe("mapOrganizationPayoutPoints", () => {
  it("maps time to label and numeric volume", () => {
    expect(
      mapOrganizationPayoutPoints([
        { time: "Aug 1", total_payout: "42000", total_payments: 8 },
        { time: "  ", total_payout: "1", total_payments: 1 },
      ]),
    ).toEqual([{ label: "Aug 1", volume: 42000, transaction: 8 }]);
  });
});

describe("mapOrganizationHighPriorityItems", () => {
  it("keeps known categories and drops unknown ones", () => {
    expect(
      mapOrganizationHighPriorityItems([
        { category: "payroll", count: 3, month: "September" },
        { category: "payFailed", count: 2, month: "August" },
        { category: "paymentRequest", count: 1, month: "September" },
        { category: "other", count: 9, month: "May" },
      ]),
    ).toEqual([
      { category: ORGANIZATION_HIGH_PRIORITY_CATEGORY.Payroll, count: 3, month: "September" },
      { category: ORGANIZATION_HIGH_PRIORITY_CATEGORY.PayFailed, count: 2, month: "August" },
      {
        category: ORGANIZATION_HIGH_PRIORITY_CATEGORY.PaymentRequest,
        count: 1,
        month: "September",
      },
    ]);
  });
});

describe("pickOrganization", () => {
  it("prefers the matching id and otherwise uses the first row", () => {
    const items = mapOrganizationList([
      { id: 2, name: "Beta", org_id: "b", role: "admin" },
      { id: 9, name: "Eureka Labs", logo: "https://cdn.example/logo.png", org_id: "e", role: "admin" },
    ]);
    expect(pickOrganization(items, 9)?.name).toBe("Eureka Labs");
    expect(pickOrganization(items, 1)?.id).toBe(2);
    expect(pickOrganization([], 9)).toBeNull();
  });
});
