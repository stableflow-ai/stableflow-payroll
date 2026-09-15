export const DOCS_LOCALE = {
  En: "en",
  Zh: "zh",
} as const;

export type DocsLocale = (typeof DOCS_LOCALE)[keyof typeof DOCS_LOCALE];

export const DOCS_TOC_RAIL_QUERY = "(min-width: 1024px)";
export const DOCS_WIDE_DRAWER_QUERY = "(min-width: 768px)";
export const DOCS_BACK_TO_TOP_SCROLL_PX = 400;
export const DOCS_SPY_VIEWPORT_RATIO = 0.25;

export type DocsTocLeaf = {
  id: string;
  label: Record<DocsLocale, string>;
};

export type DocsTocSection = DocsTocLeaf & {
  children?: readonly DocsTocLeaf[];
};

export const DOCS_TOC: readonly DocsTocSection[] = [
  {
    id: "1-platform-overview",
    label: { en: "1. Platform overview", zh: "1. 平台概览" },
    children: [
      { id: "navigation-at-a-glance", label: { en: "Navigation at a glance", zh: "导航总览" } },
      { id: "roles-at-a-glance", label: { en: "Roles at a glance", zh: "角色速览" } },
    ],
  },
  {
    id: "2-sign-in-and-register",
    label: { en: "2. Sign in and register", zh: "2. 登录、注册" },
    children: [
      { id: "21-email-sign-in", label: { en: "2.1 Email sign-in", zh: "2.1 邮箱登录" } },
      {
        id: "22-register-an-organizationadmin",
        label: { en: "2.2 Register an organization (admin)", zh: "2.2 注册组织（管理员）" },
      },
      {
        id: "23-google-sign-in-bindand-register",
        label: { en: "2.3 Google sign-in, bind, and register", zh: "2.3 Google 登录、绑定与注册" },
      },
      {
        id: "24-join-by-invite-member",
        label: { en: "2.4 Join by invite (member)", zh: "2.4 邀请加入（成员）" },
      },
      {
        id: "25-forgot-password-change-password",
        label: { en: "2.5 Forgot password / change password", zh: "2.5 忘记密码 / 修改密码" },
      },
    ],
  },
  {
    id: "3-workspace-and-navigation",
    label: { en: "3. Workspace and navigation", zh: "3. 主界面与导航使用" },
    children: [
      { id: "31-sidebar", label: { en: "3.1 Sidebar", zh: "3.1 侧边栏" } },
      { id: "32-overview", label: { en: "3.2 Overview", zh: "3.2 概览 Overview" } },
    ],
  },
  {
    id: "4-payments",
    label: { en: "4. Payments", zh: "4. 支付" },
    children: [
      { id: "41-connect-a-wallet", label: { en: "4.1 Connect a wallet", zh: "4.1 连接钱包" } },
      { id: "42-single-payment", label: { en: "4.2 Single Payment", zh: "4.2 单笔支付 Single Payment" } },
      { id: "43-payment-by-form", label: { en: "4.3 Payment by Form", zh: "4.3 按表单支付 Payment by Form" } },
      { id: "44-payment-result", label: { en: "4.4 Payment result", zh: "4.4 付款结果页" } },
      {
        id: "45-after-payment-and-batchlimits",
        label: { en: "4.5 After payment, and batch limits", zh: "4.5 支付后与批量限额" },
      },
    ],
  },
  {
    id: "5-operations",
    label: { en: "5. Operations", zh: "5. Operations 管理模块" },
    children: [
      { id: "51-payroll", label: { en: "5.1 Payroll", zh: "5.1 工资单（Payroll）" } },
      { id: "52-expenses", label: { en: "5.2 Expenses", zh: "5.2 费用报销（Expenses）" } },
      { id: "53-bonus", label: { en: "5.3 Bonus", zh: "5.3 奖金管理（Bonus）" } },
      {
        id: "54-more-scenarios-manageoperations",
        label: { en: "5.4 More scenarios (Manage Operations)", zh: "5.4 更多场景（Manage Operations）" },
      },
    ],
  },
  { id: "6-team", label: { en: "6. Team", zh: "6. 团队（Team）" } },
  { id: "7-history", label: { en: "7. History", zh: "7. 历史记录（History）" } },
  { id: "8-settings", label: { en: "8. Settings", zh: "8. 设置（Settings）" } },
  {
    id: "9-advanced",
    label: { en: "9. Advanced", zh: "9. 高级部分（Advanced）" },
    children: [
      { id: "91-roles-and-permissions", label: { en: "9.1 Roles and permissions", zh: "9.1 角色与权限" } },
      { id: "92-member-flows", label: { en: "9.2 Member flows", zh: "9.2 成员端全流程" } },
      {
        id: "93-limits-chains-and-notes",
        label: { en: "9.3 Limits, chains, and notes", zh: "9.3 限额、链与常见注意" },
      },
    ],
  },
];

export const DOCS_TOC_IDS = DOCS_TOC.flatMap((section) => [
  section.id,
  ...(section.children?.map((child) => child.id) ?? []),
]);

export type DocsTocId = (typeof DOCS_TOC_IDS)[number];

export const DOCS_COPY: Record<
  DocsLocale,
  {
    documentTitle: string;
    back: string;
    contents: string;
    backToTop: string;
    language: string;
    en: string;
    zh: string;
  }
> = {
  en: {
    documentTitle: "Stableflow Payroll User Guide",
    back: "Back",
    contents: "Contents",
    backToTop: "Back to top",
    language: "Language",
    en: "English",
    zh: "中文",
  },
  zh: {
    documentTitle: "Stableflow Payroll 使用文档",
    back: "Back",
    contents: "Contents",
    backToTop: "回到顶部",
    language: "Language",
    en: "English",
    zh: "中文",
  },
};

export function isDocsTocId(id: string): id is DocsTocId {
  return DOCS_TOC_IDS.includes(id);
}
