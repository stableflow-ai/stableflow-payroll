import { describe, expect, it } from "vitest";
import { ORGANIZATION_HIGH_PRIORITY_CATEGORY } from "@/types/organization";
import { VOLUME_PERIOD } from "@/types/payout";
import { BONUS_HISTORY_PATH } from "@/views/bonus/config";
import { EXPENSE_HISTORY_PATH } from "@/views/expense/config";
import { TEAM_PATH } from "@/views/pay/config";
import { PAYROLL_HISTORY_PATH } from "@/views/payroll/config";
import { CHART_METRIC, HIGH_PRIORITY_PATH } from "./config";
import {
  adminChartPoints,
  emptyAdminChartBuckets,
  emptyVolumeBuckets,
  formatAdminChartAxis,
  greetingName,
  highPriorityDisplayItems,
  evenCategoryTicks,
  maxCategoryTicks,
  volumeChartPoints,
} from "./utils";

describe("greetingName", () => {
  it("uses the first word of the display name", () => {
    expect(greetingName("Andrew Chen")).toBe("Andrew");
    expect(greetingName("Andrew")).toBe("Andrew");
    expect(greetingName("  ")).toBe("");
  });
});

describe("volumeChartPoints", () => {
  it("keeps provided series and fills empty periods with zero buckets", () => {
    const now = new Date("2026-09-04T00:00:00.000Z");
    const series = [{ label: "Jul", income: 10, payout: 1, incomeTx: 1, payoutTx: 1 }];
    expect(volumeChartPoints(VOLUME_PERIOD.Monthly, series, now)).toEqual(series);

    const empty = emptyVolumeBuckets(VOLUME_PERIOD.Daily, now);
    expect(empty).toHaveLength(7);
    expect(empty.every((point) => point.income === 0 && point.payout === 0)).toBe(true);
    expect(volumeChartPoints(VOLUME_PERIOD.Daily, [], now)).toEqual(empty);
  });
});

describe("adminChartPoints", () => {
  it("keeps provided series and fills empty periods with zero buckets", () => {
    const now = new Date("2026-09-04T00:00:00.000Z");
    const series = [{ label: "Jul", volume: 100, transaction: 2 }];
    expect(adminChartPoints(VOLUME_PERIOD.Monthly, series, now)).toEqual(series);

    const empty = emptyAdminChartBuckets(VOLUME_PERIOD.Daily, now);
    expect(empty).toHaveLength(7);
    expect(empty.every((point) => point.volume === 0 && point.transaction === 0)).toBe(true);
    expect(adminChartPoints(VOLUME_PERIOD.Daily, [], now)).toEqual(empty);
  });
});

describe("highPriorityDisplayItems", () => {
  it("maps API title and description onto routes", () => {
    expect(
      highPriorityDisplayItems([
        {
          category: ORGANIZATION_HIGH_PRIORITY_CATEGORY.Payroll,
          subCategory: "",
          title: "September payroll",
          description: "3 items",
        },
        {
          category: ORGANIZATION_HIGH_PRIORITY_CATEGORY.PaymentRequest,
          subCategory: "",
          title: "2 Payment Requests",
          description: "August",
        },
        {
          category: ORGANIZATION_HIGH_PRIORITY_CATEGORY.PayFailed,
          subCategory: "",
          title: "Transaction Failed",
          description: "July · 4 failed",
        },
        {
          category: ORGANIZATION_HIGH_PRIORITY_CATEGORY.PayFailed,
          subCategory: "payroll",
          title: "Payroll Failed",
          description: "September",
        },
        {
          category: ORGANIZATION_HIGH_PRIORITY_CATEGORY.PayFailed,
          subCategory: "expense",
          title: "Expense Failed",
          description: "September",
        },
        {
          category: ORGANIZATION_HIGH_PRIORITY_CATEGORY.PayFailed,
          subCategory: "bonus",
          title: "Bonus Failed",
          description: "September",
        },
        {
          category: ORGANIZATION_HIGH_PRIORITY_CATEGORY.PayFailed,
          subCategory: "office",
          title: "Office Failed",
          description: "September",
        },
        {
          category: ORGANIZATION_HIGH_PRIORITY_CATEGORY.Join,
          subCategory: "",
          title: "2 Team Member Joined",
          description: "Jimmy Self 1, jmg2",
        },
      ]),
    ).toEqual([
      {
        id: "hp-payroll-0",
        kind: ORGANIZATION_HIGH_PRIORITY_CATEGORY.Payroll,
        title: "September payroll",
        subtitle: "3 items",
        to: HIGH_PRIORITY_PATH[ORGANIZATION_HIGH_PRIORITY_CATEGORY.Payroll],
      },
      {
        id: "hp-requests-1",
        kind: ORGANIZATION_HIGH_PRIORITY_CATEGORY.PaymentRequest,
        title: "2 Payment Requests",
        subtitle: "August",
        to: HIGH_PRIORITY_PATH[ORGANIZATION_HIGH_PRIORITY_CATEGORY.PaymentRequest],
      },
      {
        id: "hp-payFailed-2",
        kind: ORGANIZATION_HIGH_PRIORITY_CATEGORY.PayFailed,
        title: "Transaction Failed",
        subtitle: "July · 4 failed",
        to: HIGH_PRIORITY_PATH[ORGANIZATION_HIGH_PRIORITY_CATEGORY.PayFailed],
      },
      {
        id: "hp-payFailed-3",
        kind: ORGANIZATION_HIGH_PRIORITY_CATEGORY.PayFailed,
        title: "Payroll Failed",
        subtitle: "September",
        to: PAYROLL_HISTORY_PATH,
      },
      {
        id: "hp-payFailed-4",
        kind: ORGANIZATION_HIGH_PRIORITY_CATEGORY.PayFailed,
        title: "Expense Failed",
        subtitle: "September",
        to: EXPENSE_HISTORY_PATH,
      },
      {
        id: "hp-payFailed-5",
        kind: ORGANIZATION_HIGH_PRIORITY_CATEGORY.PayFailed,
        title: "Bonus Failed",
        subtitle: "September",
        to: BONUS_HISTORY_PATH,
      },
      {
        id: "hp-payFailed-6",
        kind: ORGANIZATION_HIGH_PRIORITY_CATEGORY.PayFailed,
        title: "Office Failed",
        subtitle: "September",
        to: "/pay/office/history",
      },
      {
        id: "hp-join-7",
        kind: ORGANIZATION_HIGH_PRIORITY_CATEGORY.Join,
        title: "2 Team Member Joined",
        subtitle: "Jimmy Self 1, jmg2",
        to: TEAM_PATH,
      },
    ]);
  });
});

describe("formatAdminChartAxis", () => {
  it("formats volume as compact USD and transactions as integers", () => {
    expect(formatAdminChartAxis(0, CHART_METRIC.Volume)).toBe("$0");
    expect(formatAdminChartAxis(20000, CHART_METRIC.Volume)).toBe("$20K");
    expect(formatAdminChartAxis(12, CHART_METRIC.Transaction)).toBe("12");
  });
});

describe("evenCategoryTicks", () => {
  it("keeps first and last labels with even index gaps", () => {
    const labels = Array.from({ length: 30 }, (_, index) => `d${index}`);
    expect(evenCategoryTicks(labels, 6)).toEqual(["d0", "d6", "d12", "d17", "d23", "d29"]);
    expect(evenCategoryTicks(labels, 30)).toEqual(labels);
    expect(evenCategoryTicks(labels, 0)).toEqual(["d0", "d29"]);
  });
});

describe("maxCategoryTicks", () => {
  it("uses at least two ticks when the plot width is unknown", () => {
    expect(maxCategoryTicks(0, 58)).toBe(2);
  });
});
