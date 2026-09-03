export const TEAM_PAGE_SIZE = 10;

export const TEAM_TABLE_COLUMNS =
  "minmax(160px,1.2fr) minmax(120px,0.85fr) minmax(100px,0.7fr) minmax(160px,1.1fr) minmax(140px,0.9fr) 40px";

export const TEAM_INVITE_TYPE = "Employee";

export const TEAM_INVITE_ROLE = {
  Developer: "Developer",
  Product: "Product",
  Growth: "Growth",
  Finance: "Finance",
  Operations: "Operations",
  Other: "Other",
} as const;

export type TeamInviteRole = (typeof TEAM_INVITE_ROLE)[keyof typeof TEAM_INVITE_ROLE];

export const TEAM_INVITE_ROLE_OPTIONS: Array<{ value: TeamInviteRole; label: string }> = [
  { value: TEAM_INVITE_ROLE.Developer, label: "Developer" },
  { value: TEAM_INVITE_ROLE.Product, label: "Product" },
  { value: TEAM_INVITE_ROLE.Growth, label: "Growth" },
  { value: TEAM_INVITE_ROLE.Finance, label: "Finance" },
  { value: TEAM_INVITE_ROLE.Operations, label: "Operations" },
  { value: TEAM_INVITE_ROLE.Other, label: "Other" },
];

export const TEAM_WALLET_DISPLAY_PREFIX = 5;
export const TEAM_WALLET_DISPLAY_SUFFIX = 5;
