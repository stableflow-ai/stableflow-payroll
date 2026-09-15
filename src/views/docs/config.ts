export const DOCS_TOC_RAIL_QUERY = "(min-width: 1024px)";
export const DOCS_WIDE_DRAWER_QUERY = "(min-width: 768px)";
export const DOCS_BACK_TO_TOP_SCROLL_PX = 400;
export const DOCS_SPY_VIEWPORT_RATIO = 0.25;

export type DocsTocLeaf = {
  id: string;
  label: string;
};

export type DocsTocSection = DocsTocLeaf & {
  children?: readonly DocsTocLeaf[];
};

export const DOCS_TOC: readonly DocsTocSection[] = [
  {
    id: "1-platform-overview",
    label: "1. Platform overview",
    children: [
      { id: "navigation-at-a-glance", label: "Navigation at a glance" },
      { id: "roles-at-a-glance", label: "Roles at a glance" },
    ],
  },
  {
    id: "2-sign-in-and-register",
    label: "2. Sign in and register",
    children: [
      { id: "21-email-sign-in", label: "2.1 Email sign-in" },
      {
        id: "22-register-an-organizationadmin",
        label: "2.2 Register an organization (admin)",
      },
      {
        id: "23-google-sign-in-bindand-register",
        label: "2.3 Google sign-in, bind, and register",
      },
      {
        id: "24-join-by-invite-member",
        label: "2.4 Join by invite (member)",
      },
      {
        id: "25-forgot-password-change-password",
        label: "2.5 Forgot password / change password",
      },
    ],
  },
  {
    id: "3-workspace-and-navigation",
    label: "3. Workspace and navigation",
    children: [
      { id: "31-sidebar", label: "3.1 Sidebar" },
      { id: "32-overview", label: "3.2 Overview" },
    ],
  },
  {
    id: "4-payments",
    label: "4. Payments",
    children: [
      { id: "41-connect-a-wallet", label: "4.1 Connect a wallet" },
      { id: "42-single-payment", label: "4.2 Single Payment" },
      { id: "43-payment-by-form", label: "4.3 Payment by Form" },
      { id: "44-payment-result", label: "4.4 Payment result" },
      {
        id: "45-after-payment-and-batchlimits",
        label: "4.5 After payment, and batch limits",
      },
    ],
  },
  {
    id: "5-operations",
    label: "5. Operations",
    children: [
      { id: "51-payroll", label: "5.1 Payroll" },
      { id: "52-expenses", label: "5.2 Expenses" },
      { id: "53-bonus", label: "5.3 Bonus" },
      {
        id: "54-more-scenarios-manageoperations",
        label: "5.4 More scenarios (Manage Operations)",
      },
    ],
  },
  { id: "6-team", label: "6. Team" },
  { id: "7-history", label: "7. History" },
  { id: "8-settings", label: "8. Settings" },
  {
    id: "9-advanced",
    label: "9. Advanced",
    children: [
      { id: "91-roles-and-permissions", label: "9.1 Roles and permissions" },
      { id: "92-member-flows", label: "9.2 Member flows" },
      {
        id: "93-limits-chains-and-notes",
        label: "9.3 Limits, chains, and notes",
      },
    ],
  },
];

export const DOCS_TOC_IDS = DOCS_TOC.flatMap((section) => [
  section.id,
  ...(section.children?.map((child) => child.id) ?? []),
]);

export type DocsTocId = (typeof DOCS_TOC_IDS)[number];

export const DOCS_COPY = {
  documentTitle: "Stableflow Payroll User Guide",
  back: "Back",
  contents: "Contents",
  backToTop: "Back to top",
} as const;

export function isDocsTocId(id: string): id is DocsTocId {
  return DOCS_TOC_IDS.includes(id);
}
