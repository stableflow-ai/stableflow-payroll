import type { ComponentType } from "react";
import {
  IconHistory,
  IconOperations,
  IconOverview,
  IconPayment,
  IconRequest,
  IconSetting,
  IconTeam,
} from "@/components/icons";
import type { IconProps } from "@/components/icons/types";
import { AUTH_USER_ROLE, type AuthUserRole } from "@/types/auth";
import { PAYOUT_SYMBOLS } from "@/stores/intents-tokens";

/** TODO(api): fallback organization name when profile has none. */
export const MOCK_ORGANIZATION_NAME = "Eureka Labs";

export const PAY_FORM_PATH = "/pay/form";

export const PAY_NAV_ID = {
  Overview: "overview",
  Payment: "payment",
  RequestPayment: "request",
  Operations: "operations",
  Payroll: "payroll",
  Expense: "expense",
  Bonus: "bonus",
  Team: "team",
  History: "history",
  Setting: "setting",
} as const;

export type PayNavLeaf = {
  id: string;
  label: string;
  to: string;
  icon?: ComponentType<IconProps>;
  match?: readonly string[];
};

export type PayNavGroupItem = {
  id: string;
  label: string;
  icon: ComponentType<IconProps>;
  children: readonly PayNavLeaf[];
};

export type PayNavItem = PayNavLeaf | PayNavGroupItem;

export function isPayNavGroup(item: PayNavItem): item is PayNavGroupItem {
  return "children" in item;
}

export const PAY_NAV_ITEMS: readonly PayNavItem[] = [
  { id: PAY_NAV_ID.Overview, label: "Overview", to: "/", icon: IconOverview },
  {
    id: PAY_NAV_ID.Payment,
    label: "Payment",
    to: "/pay",
    icon: IconPayment,
    match: ["/pay", PAY_FORM_PATH],
  },
  {
    id: PAY_NAV_ID.Operations,
    label: "Operations",
    icon: IconOperations,
    children: [
      { id: PAY_NAV_ID.Payroll, label: "Payroll", to: "/pay/payroll", match: ["/pay/payroll", "/pay/batch"] },
      { id: PAY_NAV_ID.Expense, label: "Expense", to: "/pay/expense" },
      { id: PAY_NAV_ID.Bonus, label: "Bonus", to: "/pay/bonus" },
    ],
  },
  { id: PAY_NAV_ID.Team, label: "Team", to: "/pay/team", icon: IconTeam },
  { id: PAY_NAV_ID.History, label: "History", to: "/pay/history", icon: IconHistory },
  { id: PAY_NAV_ID.Setting, label: "Setting", to: "/pay/setting", icon: IconSetting },
];

const EMPLOYEE_REQUEST_NAV: PayNavLeaf = {
  id: PAY_NAV_ID.RequestPayment,
  label: "Request Payment",
  to: "/pay/request",
  icon: IconRequest,
};

const EMPLOYEE_HIDDEN_NAV_IDS = new Set<string>([PAY_NAV_ID.Operations, PAY_NAV_ID.Team]);

export function payNavItemsForRole(role: AuthUserRole): readonly PayNavItem[] {
  if (role !== AUTH_USER_ROLE.Employee) return PAY_NAV_ITEMS;

  const items: PayNavItem[] = [];
  for (const item of PAY_NAV_ITEMS) {
    if (isPayNavGroup(item) || EMPLOYEE_HIDDEN_NAV_IDS.has(item.id)) continue;
    if (item.id === PAY_NAV_ID.Payment) {
      items.push({ ...item, match: ["/pay"] });
      items.push(EMPLOYEE_REQUEST_NAV);
      continue;
    }
    items.push(item);
  }
  return items;
}

export const PAY_ADMIN_ONLY_PATHS = [
  PAY_FORM_PATH,
  "/pay/batch",
  "/pay/payroll",
  "/pay/expense",
  "/pay/reimbursement",
  "/pay/bonus",
  "/pay/team",
] as const;

export const PAY_MODE_TABS = [
  { label: "Single Payment", to: "/pay" },
  { label: "Payment by form", to: PAY_FORM_PATH },
] as const;

export function isPayModePath(pathname: string): boolean {
  return pathname === "/pay" || pathname === PAY_FORM_PATH;
}

export function isPayNavLeafActive(item: PayNavLeaf, pathname: string): boolean {
  if (item.match) return item.match.includes(pathname);
  return pathname === item.to;
}

export function payTitleForPath(pathname: string, role: AuthUserRole = AUTH_USER_ROLE.Admin): string {
  for (const item of payNavItemsForRole(role)) {
    if (isPayNavGroup(item)) {
      const child = item.children.find((row) => isPayNavLeafActive(row, pathname));
      if (child) return child.label;
      continue;
    }
    if (isPayNavLeafActive(item, pathname)) return item.label;
  }
  return PAY_ROUTE_TITLES[pathname] ?? "Pay";
}

/** Hosted-checkout return page. Sent as `success_url` when creating a payment. */
export const PAYOUT_RESULT_PATH = "/pay/result";

/**
 * Status values seen on the result page. `success` comes from the hosted
 * checkout callback, `completed` from `GET /v1/payroll/payments/{payment_id}`.
 */
export const PAYOUT_RESULT_STATUS = {
  Success: "success",
  Completed: "completed",
} as const;

/** Titles for Pay routes that are not in the sidebar. */
export const PAY_ROUTE_TITLES: Record<string, string> = {
  [PAYOUT_RESULT_PATH]: "Payment Result",
  "/pay/pending": "Pending Payouts",
  "/pay/request": "Request Payment",
};

export const PAYOUT_TABLE_COLUMNS =
  "minmax(150px,1.3fr) minmax(72px,0.5fr) minmax(140px,1fr) minmax(130px,1fr) minmax(150px,1fr) minmax(150px,0.95fr)";
export const RECEIVED_PAYMENT_TABLE_COLUMNS =
  "minmax(160px,1.2fr) minmax(150px,1.1fr) minmax(148px,0.95fr) minmax(148px,0.95fr) minmax(130px,0.9fr) minmax(118px,0.85fr) minmax(72px,0.45fr)";
export const HISTORY_PAGE_SIZE = 10;
export const EXPORT_FILENAME_STAMP = "yyyyMMdd-HHmmss";
export const HISTORY_STATUS_FILTER = {
  All: "all",
  Complete: "completed",
  Failed: "failed",
} as const;

export const HISTORY_ASSET_FILTER = {
  All: "all",
  ...Object.fromEntries(PAYOUT_SYMBOLS.map((symbol) => [symbol, symbol])),
} as const;

export const AMOUNT_MAX_DECIMALS = 6;
export const QUOTE_DEBOUNCE_MS = 900;
export const QUICK_PAY_SLIPPAGE_TOLERANCE = 5;
export const ORIGIN_BALANCE_POLL_MS = 20_000;
export const MEMO_MAX_LENGTH = 200;
export const CONTACT_NAME_MAX_LENGTH = 50;
export const EMAIL_MAX_LENGTH = 50;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SPENT_BATCH_MESSAGE = "This quote was already used. Refreshing the quote.";
export const QUOTE_EXPIRED_MESSAGE = "Quote expired. Refreshing.";

export const DESCRIPTION_MAX_LENGTH = 200;
export const PAYMENT_NAME_MAX_LENGTH = 50;
export const PAYMENT_NAME_ELLIPSIS_PREFIX = 8;
export const PAYMENT_NAME_ELLIPSIS_SUFFIX = 8;

export const PAY_REQUEST_STATUS = {
  Pending: "pending",
  Submitted: "submitted",
  Completed: "completed",
  Withdrawing: "withdrawing",
  Withdrawed: "withdrawed",
  Failed: "failed",
} as const;

export const PAY_REQUEST_MODE = {
  Standard: "standard",
  Private: "private",
} as const;

export const REQUEST_LIST_REFRESH_MS = 30_000;
export const REQUEST_WITHDRAW_COUNT_POLL_MS = 120_000;

export const IMPORT_MAX_ROWS = 50;
export const IMPORT_CSV_ACCEPT = ".csv,text/csv";
export const IMPORT_CSV_TEMPLATE_FILENAME = "payout-import-template.csv";
export const IMPORT_CSV_TEMPLATE = [
  "recipient,amount,token,network,memo",
  "0x557be3f47a45499385f60cd64e2ff455e42a3311,100,USDC,eth,payroll",
  "stableflow.near,50,USDT,near,",
  "9JXR51yBLBgfesHF8SJgKWkNnx4FxtJCxCc3AV31TBsn,25,USDC,sol,bonus",
  "TJbLVQHYf61a36iC7oyxdMiNSoqTMKYAMv,1,USDT,tron",
].join("\n");
