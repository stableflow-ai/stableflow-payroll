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
import { BONUS_HISTORY_PATH, BONUS_PATH } from "@/views/bonus/config";
import {
  EXPENSE_HISTORY_PATH,
  EXPENSE_PATH,
  EXPENSE_REQUESTS_PATH,
} from "@/views/expense/config";
import { PAYROLL_HISTORY_PATH, PAYROLL_PATH } from "@/views/payroll/config";

export const PAY_PATH = "/pay";
export const PAY_FORM_PATH = "/pay/form";
export const TEAM_PATH = "/team";
export const HISTORY_PATH = "/history";
export const SETTING_PATH = "/setting";
export const SETTING_SLACK_CALLBACK_PATH = "/setting/slack/callback";

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
    to: PAY_PATH,
    icon: IconPayment,
    match: [PAY_PATH, PAY_FORM_PATH],
  },
  {
    id: PAY_NAV_ID.Operations,
    label: "Operations",
    icon: IconOperations,
    children: [
      {
        id: PAY_NAV_ID.Payroll,
        label: "Payroll",
        to: PAYROLL_PATH,
        match: [PAYROLL_PATH, PAYROLL_HISTORY_PATH],
      },
      {
        id: PAY_NAV_ID.Expense,
        label: "Expense",
        to: EXPENSE_PATH,
        match: [EXPENSE_PATH, EXPENSE_REQUESTS_PATH, EXPENSE_HISTORY_PATH],
      },
      {
        id: PAY_NAV_ID.Bonus,
        label: "Bonus",
        to: BONUS_PATH,
        match: [BONUS_PATH, BONUS_HISTORY_PATH],
      },
    ],
  },
  { id: PAY_NAV_ID.Team, label: "Team", to: TEAM_PATH, icon: IconTeam },
  { id: PAY_NAV_ID.History, label: "History", to: HISTORY_PATH, icon: IconHistory },
  { id: PAY_NAV_ID.Setting, label: "Settings", to: SETTING_PATH, icon: IconSetting },
];

export const PAY_REQUEST_PATH = "/pay/request";
export const PAY_REQUESTS_PATH = "/pay/requests";

const EMPLOYEE_REQUEST_NAV: PayNavLeaf = {
  id: PAY_NAV_ID.RequestPayment,
  label: "Request Payment",
  to: PAY_REQUEST_PATH,
  icon: IconRequest,
  match: [PAY_REQUEST_PATH, PAY_REQUESTS_PATH],
};

const EMPLOYEE_HIDDEN_NAV_IDS = new Set<string>([PAY_NAV_ID.Operations, PAY_NAV_ID.Team]);

export function payNavItemsForRole(role: AuthUserRole): readonly PayNavItem[] {
  if (role !== AUTH_USER_ROLE.User) return PAY_NAV_ITEMS;

  const items: PayNavItem[] = [];
  for (const item of PAY_NAV_ITEMS) {
    if (isPayNavGroup(item) || EMPLOYEE_HIDDEN_NAV_IDS.has(item.id)) continue;
    if (item.id === PAY_NAV_ID.Payment) {
      items.push({ ...item, match: [PAY_PATH] });
      items.push(EMPLOYEE_REQUEST_NAV);
      continue;
    }
    items.push(item);
  }
  return items;
}

export const PAY_ADMIN_ONLY_PATHS = [
  PAY_FORM_PATH,
  PAYROLL_PATH,
  EXPENSE_PATH,
  BONUS_PATH,
  TEAM_PATH,
] as const;

export const PAY_EMPLOYEE_ONLY_PATHS = [PAY_REQUEST_PATH, PAY_REQUESTS_PATH] as const;

export const PAY_MODE_TABS = [
  { label: "Single Payment", to: PAY_PATH },
  { label: "Payment by form", to: PAY_FORM_PATH },
] as const;

export const PAY_REQUEST_TABS = [
  { label: "Request Payment", to: PAY_REQUEST_PATH },
  { label: "Requests", to: PAY_REQUESTS_PATH },
] as const;

export function isPayModePath(pathname: string): boolean {
  return pathname === PAY_PATH || pathname === PAY_FORM_PATH;
}

export function isPayShellPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/pay") ||
    pathname === TEAM_PATH ||
    pathname === HISTORY_PATH ||
    pathname === SETTING_PATH ||
    pathname.startsWith(`${SETTING_PATH}/`)
  );
}

export function isAdminOnlyPayPath(pathname: string): boolean {
  return PAY_ADMIN_ONLY_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isRequestPaymentPath(pathname: string): boolean {
  return pathname === PAY_REQUEST_PATH || pathname === PAY_REQUESTS_PATH;
}

export function isPayNavLeafActive(item: PayNavLeaf, pathname: string): boolean {
  const paths = item.match ?? [item.to];
  return paths.some((path) => {
    if (path === PAYROLL_HISTORY_PATH || path === SETTING_PATH) {
      return pathname === path || pathname.startsWith(`${path}/`);
    }
    return pathname === path;
  });
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
  [PAY_REQUEST_PATH]: "Request Payment",
  [PAY_REQUESTS_PATH]: "Requests",
  [SETTING_SLACK_CALLBACK_PATH]: "Connecting Slack",
};

export const PAYOUT_TABLE_COLUMNS =
  "minmax(150px,1.3fr) minmax(72px,0.5fr) minmax(140px,1fr) minmax(130px,1fr) minmax(150px,1fr) minmax(150px,0.95fr)";
export const REQUESTS_TABLE_COLUMNS =
  "minmax(180px,1.3fr) minmax(160px,1.1fr) minmax(140px,0.95fr) minmax(140px,0.95fr) minmax(140px,0.95fr) minmax(110px,0.7fr)";
export const EXPORT_FILENAME_STAMP = "yyyyMMdd-HHmmss";

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
export const INSUFFICIENT_APPROVAL_REQUOTE_MESSAGE =
  "Insufficient approval. Refreshing the quote.";

export const DESCRIPTION_MAX_LENGTH = 200;
export const PAYMENT_NAME_MAX_LENGTH = 50;
export const PAYMENT_NAME_ELLIPSIS_PREFIX = 8;
export const PAYMENT_NAME_ELLIPSIS_SUFFIX = 8;
export const REQUESTS_PAGE_SIZE = 10;

export const PAY_REQUEST_STATUS = {
  Pending: "pending",
  Created: "created",
  Processing: "processing",
  Submitted: "submitted",
  Completed: "completed",
  Failed: "failed",
  Expired: "expired",
} as const;

export const PAY_REQUEST_STATUS_CLASS = {
  [PAY_REQUEST_STATUS.Pending]: "text-[#3f8afb]",
  [PAY_REQUEST_STATUS.Created]: "text-[#3f8afb]",
  [PAY_REQUEST_STATUS.Processing]: "text-[#3f8afb]",
  [PAY_REQUEST_STATUS.Submitted]: "text-[#3f8afb]",
  [PAY_REQUEST_STATUS.Completed]: "text-[#84a20f]",
  [PAY_REQUEST_STATUS.Failed]: "text-danger",
  [PAY_REQUEST_STATUS.Expired]: "text-danger",
} as const;

export const PAY_REQUEST_MODE = {
  Standard: "standard",
  Private: "private",
} as const;

export const IMPORT_MAX_ROWS = 50;
export const IMPORT_CSV_ACCEPT = ".csv,text/csv";
export const IMPORT_CSV_TEMPLATE_FILENAME = "payout-import-template.csv";
export const IMPORT_CSV_TEMPLATE = [
  "recipient,email,amount,token,network,memo",
  "0x557be3f47a45499385f60cd64e2ff455e42a3311,alice@example.com,100,USDC,eth,payroll",
  "stableflow.near,bob@example.com,50,USDT,near,",
  "9JXR51yBLBgfesHF8SJgKWkNnx4FxtJCxCc3AV31TBsn,carol@example.com,25,USDC,sol,bonus",
  "TJbLVQHYf61a36iC7oyxdMiNSoqTMKYAMv,dave@example.com,1,USDT,tron",
].join("\n");
