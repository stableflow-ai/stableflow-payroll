export const AUTH_BRAND_BG = "#3F8AFB";
export const AUTH_PANEL_BG = "#F6F6F6";

export const AUTH_CARD_CLASS =
  "flex w-full max-w-[420px] flex-col rounded-[20px] border border-white bg-[#fdfdfd] px-7 pt-8 pb-8 shadow-[0_0_20px_rgba(0,0,0,0.06)]";

export const AUTH_LABEL_CLASS = "font-montserrat text-[14px] font-medium text-[#909090]";

export const AUTH_INPUT_CLASS =
  "h-[42px] w-full rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-4 font-montserrat text-sm font-medium text-black outline-none placeholder:text-black/30 focus:border-[#c8c8c8]";

export const AUTH_LINK_CLASS =
  "mt-5 text-center font-montserrat text-sm font-medium text-[#909090]";

export const AUTH_LINK_ACCENT_CLASS = "text-[#3f8afb] hover:text-[#3f8afb]/90";

export const AUTH_FEATURE_ICON_KEYS = ["lock", "shield", "node"] as const;
export type AuthFeatureIconKey = (typeof AUTH_FEATURE_ICON_KEYS)[number];

export const AUTH_BRAND = {
  headline: "Confidential Payments.",
  subhead:
    "Send across chains without creating a direct public link between sender and recipient.",
  features: [
    {
      icon: "lock" as AuthFeatureIconKey,
      title: "Confidential by default",
      body: "Reduce direct public sender  recipient linkage.",
    },
    {
      icon: "shield" as AuthFeatureIconKey,
      title: "Self-custodial",
      body: "Your wallet. Your funds. You authorize every payment",
    },
    {
      icon: "node" as AuthFeatureIconKey,
      title: "Cross-chain",
      body: "Pay across supported network whilethe recipient receives on another.",
    },
  ],
  howItWorksLabel: "How it works",
  howItWorksHref: "/howitworks",
  betaLabel: "Stableflow Pay is currently in beta.",
} as const;

export const NAME_MAX_LENGTH = 50;
export const INVITE_CODE_MAX_LENGTH = 10;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 50;
export const SEND_CODE_COOLDOWN_SECONDS = 60;
export const SEND_CODE_TEXT_CLASS =
  "font-montserrat text-sm font-medium text-[#6284F5] disabled:opacity-30";
export const RESET_PASSWORD_VARIANT = {
  Guest: "guest",
  Authed: "authed",
} as const;
export type ResetPasswordVariant =
  (typeof RESET_PASSWORD_VARIANT)[keyof typeof RESET_PASSWORD_VARIANT];
export const RESET_PASSWORD_DIALOG_CARD_CLASS =
  "w-[min(100%,420px)] rounded-[20px] border-white bg-[#fdfdfd] px-7 py-8 shadow-[0_0_20px_rgba(0,0,0,0.06)]";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function nameRuleError(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Name is required";
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `Name must be at most ${NAME_MAX_LENGTH} characters`;
  }
  return null;
}

export function emailRuleError(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Email is required";
  if (!EMAIL_PATTERN.test(trimmed)) return "Enter a valid email";
  return null;
}

export function passwordRuleError(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters`;
  }
  return null;
}

export function inviteCodeRuleError(inviteCode: string): string | null {
  const trimmed = inviteCode.trim();
  if (!trimmed) return "Invite code is required";
  if (trimmed.length > INVITE_CODE_MAX_LENGTH) {
    return `Invite code must be at most ${INVITE_CODE_MAX_LENGTH} characters`;
  }
  return null;
}

export function loginFormError(email: string, password: string): string | null {
  return emailRuleError(email) ?? passwordRuleError(password);
}

export function registerFormError(
  name: string,
  email: string,
  password: string,
  inviteCode: string,
): string | null {
  return (
    nameRuleError(name) ??
    emailRuleError(email) ??
    passwordRuleError(password) ??
    inviteCodeRuleError(inviteCode)
  );
}

export function guestResetFormError(
  email: string,
  code: string,
  newPassword: string,
  confirmPassword: string,
): string | null {
  return (
    emailRuleError(email) ??
    (code.trim() ? null : "Verification code is required") ??
    passwordRuleError(newPassword) ??
    (confirmPassword === newPassword ? null : "Passwords do not match")
  );
}

export function authedResetFormError(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): string | null {
  return (
    passwordRuleError(currentPassword) ??
    passwordRuleError(newPassword) ??
    (confirmPassword === newPassword ? null : "Passwords do not match")
  );
}
