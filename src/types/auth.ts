import type { TeamMemberWallets } from "@/types/team";

export const AUTH_USER_ROLE = {
  Admin: "admin",
  User: "user",
} as const;

export type AuthUserRole = (typeof AUTH_USER_ROLE)[keyof typeof AUTH_USER_ROLE];

export interface AuthOrganization {
  id: number;
  name: string;
  logo?: string;
  orgId?: string;
}

export interface AuthTeamMember {
  name: string;
  position: string;
  email: string;
  telegram: string;
  slack: string;
  wallets: TeamMemberWallets;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: AuthUserRole;
  telegram?: string;
  slack?: string;
  teamMember?: AuthTeamMember;
  organization?: AuthOrganization | null;
}

export interface RegisterUserBody {
  orgId: string;
  email: string;
  password: string;
  name: string;
  position?: string;
  evmAddress?: string;
  solanaAddress?: string;
  nearAddress?: string;
  tronAddress?: string;
  telegram?: string;
  slack?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterOrganizationBody {
  name: string;
  logo?: string;
}

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
  inviteCode: string;
  organization: RegisterOrganizationBody;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordCodeBody {
  email: string;
}

export interface ResetPasswordBody {
  email: string;
  code: string;
  newPassword: string;
}

export interface UpdateProfileBody {
  name: string;
}

export interface UpdateMemberProfileBody {
  name: string;
  organizationId: number;
  position: string;
  telegram: string;
  slack: string;
  wallets: TeamMemberWallets;
}
