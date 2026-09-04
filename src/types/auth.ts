export const AUTH_USER_ROLE = {
  Admin: "admin",
  Employee: "employee",
} as const;

export type AuthUserRole = (typeof AUTH_USER_ROLE)[keyof typeof AUTH_USER_ROLE];

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: AuthUserRole;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
  inviteCode: string;
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
