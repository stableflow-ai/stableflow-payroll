export const CATEGORIES_DRAWER_DESKTOP_QUERY = "(min-width: 768px)";

export const CATEGORY_ID = {
  OfficeOperation: "office-operation",
  Procurement: "procurement",
  Outsourcing: "outsourcing",
  KolMkt: "kol-mkt",
  GrantsEcosystem: "grants-ecosystem",
  OtcTreasury: "otc-treasury"
} as const;

export type CategoryId = (typeof CATEGORY_ID)[keyof typeof CATEGORY_ID];

export type CategoryItem = {
  id: CategoryId;
  title: string;
  description: string;
  iconSrc: string;
  previewSrc: string;
  templateSrc?: string;
  enabled: boolean;
};

export const CATEGORY_DASHBOARD_TAB = {
  Payments: "payments",
  PayoutHistory: "payout-history",
} as const;

export type CategoryDashboardTab =
  (typeof CATEGORY_DASHBOARD_TAB)[keyof typeof CATEGORY_DASHBOARD_TAB];

export const CATEGORY_DASHBOARD_CHART_LINE_COLOR = "#6284F5";

export const CATEGORY_DASHBOARD_CHART_Y_TICKS = [0, 10_000, 20_000, 30_000, 40_000] as const;

export const CATEGORY_PAGE_CHART_Y_TICKS = [0, 200, 400, 600] as const;

export const CATEGORY_PAGE_CHART_HIGHLIGHT_LABEL = "Jul";

export const CATEGORY_PAGE_CHART_PERIOD_LABEL = "August, 2026";

export const CATEGORY_CHART_RANGE = {
  Day: "day",
  Week: "week",
  Month: "month",
} as const;

export type CategoryChartRange =
  (typeof CATEGORY_CHART_RANGE)[keyof typeof CATEGORY_CHART_RANGE];

export const CATEGORY_CHART_RANGE_OPTIONS = [
  { value: CATEGORY_CHART_RANGE.Day, label: "Daily" },
  { value: CATEGORY_CHART_RANGE.Week, label: "Weekly" },
  { value: CATEGORY_CHART_RANGE.Month, label: "Monthly" },
] as const;

export const CATEGORY_IMPORT_CSV_TEMPLATE_FILENAME = "category-import-template.csv";

export const CATEGORY_DASHBOARD_CHART_POINTS = [
  { label: "Mar", value: 0 },
  { label: "Apr", value: 0 },
  { label: "May", value: 0 },
  { label: "Jun", value: 0 },
  { label: "Jul", value: 0 },
  { label: "Aug", value: 0 },
] as const;

export type CategoryDashboardSamplePayment = {
  payFor: string;
  address: string;
  payout: string;
  amount: string;
};

export type CategoryDashboardGroupedChild = {
  account: string;
  channel: string;
  address: string;
  payout: string;
  amount: string;
};

export type CategoryDashboardGroupedPayment = {
  payFor: string;
  accountCount: number;
  amount: string;
  accountClassName?: string;
  children: readonly CategoryDashboardGroupedChild[];
};

export type CategoryDashboardConfig = {
  chartHighlightLabel?: string;
} & (
  | { samplePayment: CategoryDashboardSamplePayment; groupedPayment?: never }
  | { groupedPayment: CategoryDashboardGroupedPayment; samplePayment?: never }
);

export const CATEGORY_DASHBOARD_GROUPED_COLUMNS =
  "minmax(0,1.4fr) minmax(0,1.3fr) minmax(0,0.8fr) minmax(0,1.3fr) minmax(0,1.1fr) minmax(0,0.7fr)";

export const CATEGORY_DASHBOARD_BY_ID: Partial<Record<CategoryId, CategoryDashboardConfig>> = {
  [CATEGORY_ID.OfficeOperation]: {
    samplePayment: {
      payFor: "September office rent",
      address: "xxxxx...xxxx",
      payout: "USDC · xxx",
      amount: "xxx",
    },
  },
  [CATEGORY_ID.Procurement]: {
    samplePayment: {
      payFor: "3 Leger Wallets Procurement",
      address: "xxxxx...xxxx",
      payout: "USDC · xxx",
      amount: "xxx",
    },
    chartHighlightLabel: "Jul",
  },
  [CATEGORY_ID.Outsourcing]: {
    samplePayment: {
      payFor: "Outsourcing testing services",
      address: "xxxxx...xxxx",
      payout: "USDC · xxx",
      amount: "xxx",
    },
    chartHighlightLabel: "Jul",
  },
  [CATEGORY_ID.KolMkt]: {
    groupedPayment: {
      payFor: "Twitter post #xxxx",
      accountCount: 3,
      amount: "1,000",
      accountClassName: "underline",
      children: [
        {
          account: "@elonmusk",
          channel: "Twitter",
          address: "xxxxx...xxxx",
          payout: "USDC · xxx",
          amount: "200",
        },
        {
          account: "@realDonaldTrump",
          channel: "Twitter",
          address: "xxxxx...xxxx",
          payout: "USDC · xxx",
          amount: "300",
        },
        {
          account: "@BarackObama",
          channel: "Twitter",
          address: "xxxxx...xxxx",
          payout: "USDC · xxx",
          amount: "500",
        },
      ],
    },
    chartHighlightLabel: "Jul",
  },
  [CATEGORY_ID.GrantsEcosystem]: {
    groupedPayment: {
      payFor: "Community Grant",
      accountCount: 3,
      amount: "1,000",
      accountClassName: "capitalize",
      children: [
        {
          account: "@Alice",
          channel: "Telegram",
          address: "xxxxx...xxxx",
          payout: "USDC · xxx",
          amount: "200",
        },
        {
          account: "@Bob",
          channel: "Telegram",
          address: "xxxxx...xxxx",
          payout: "USDC · xxx",
          amount: "300",
        },
        {
          account: "@Carl",
          channel: "Telegram",
          address: "xxxxx...xxxx",
          payout: "USDC · xxx",
          amount: "500",
        },
      ],
    },
    chartHighlightLabel: "Jul",
  },
  [CATEGORY_ID.OtcTreasury]: {
    samplePayment: {
      payFor: "Funding",
      address: "xxxxx...xxxx",
      payout: "USDC · xxx",
      amount: "xxx",
    },
    chartHighlightLabel: "Jul",
  },
};

export const CATEGORIES: readonly CategoryItem[] = [
  {
    id: CATEGORY_ID.OfficeOperation,
    title: "Office Operation",
    description:
      "Recurring basic operating expenses for team.\nOffice rent, utilities, Internet, etc.",
    iconSrc: "/categories/office-operation.svg",
    previewSrc: "/categories/preview-office-operation.png",
    enabled: true
  },
  {
    id: CATEGORY_ID.Procurement,
    title: "Procurement",
    description:
      "Payment for purchase of raw materials, operating supplies and merchandise inventory",
    iconSrc: "/categories/procurement.svg",
    previewSrc: "/categories/preview-procurement.png",
    enabled: false
  },
  {
    id: CATEGORY_ID.Outsourcing,
    title: "Outsourcing",
    description:
      "Technology outsourcing, labor outsourcing, processing fees, etc.",
    iconSrc: "/categories/outsourcing.svg",
    previewSrc: "/categories/preview-outsourcing.png",
    enabled: false
  },
  {
    id: CATEGORY_ID.KolMkt,
    title: "KOL&MKT",
    description: "KOL and marketing fees",
    iconSrc: "/categories/kol-mkt.svg",
    previewSrc: "/categories/preview-kol-mkt.png",
    enabled: false
  },
  {
    id: CATEGORY_ID.GrantsEcosystem,
    title: "Grants & Ecosystem",
    description: "Funding, partnerships and grants.",
    iconSrc: "/categories/grants-ecosystem.svg",
    previewSrc: "/categories/preview-grants-ecosystem.png",
    enabled: false
  },
  {
    id: CATEGORY_ID.OtcTreasury,
    title: "OTC & Treasury",
    description: "Asset rebalancing and OTC settlement.",
    iconSrc: "/categories/otc-treasury.svg",
    previewSrc: "/categories/preview-otc-treasury.png",
    enabled: false
  }
];

export const DEFAULT_ENABLED_CATEGORY_IDS: readonly CategoryId[] = CATEGORIES.filter(
  (item) => item.enabled,
).map((item) => item.id);

export function categoryPath(id: CategoryId): string {
  return `/pay/${id}`;
}

export function isCategoryId(value: string): value is CategoryId {
  return CATEGORIES.some((item) => item.id === value);
}

export function isCategoryPath(pathname: string): boolean {
  return CATEGORIES.some((item) => categoryPath(item.id) === pathname);
}
