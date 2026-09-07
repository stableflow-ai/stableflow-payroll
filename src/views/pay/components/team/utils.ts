import { isAddressValid, type WalletChainKind } from "@/utils";
import {
  FIELD_REQUIREMENT,
  INTEGRATION_FIELD,
  type IntegrationFieldKey,
  type IntegrationSettings,
} from "@/types/organization";
import { isValidEmail } from "../../utils";
import type { TeamMemberWallets } from "@/types/team";
import { CONTACT_NAME_MAX_LENGTH } from "../../config";
import { CHANNEL_HANDLE_MAX_LENGTH } from "../setting/config";
import { TEAM_WALLET_CHAIN_ORDER } from "./config";

export function walletForChainKind(
  wallets: TeamMemberWallets,
  kind: WalletChainKind,
): string {
  return wallets[kind]?.trim() ?? "";
}

export function memberDisplayWallet(member: { wallets: TeamMemberWallets }): string | null {
  for (const kind of TEAM_WALLET_CHAIN_ORDER) {
    const value = member.wallets[kind]?.trim();
    if (value) return value;
  }
  return null;
}

export function dash(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed || "-";
}

export function walletFieldError(value: string, kind: WalletChainKind): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return isAddressValid(trimmed, kind) ? null : `Invalid ${kindLabel(kind)} address`;
}

function kindLabel(kind: WalletChainKind): string {
  if (kind === "near") return "NEAR";
  if (kind === "solana") return "Solana";
  if (kind === "tron") return "Tron";
  return "EVM";
}

export function emailFieldError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return isValidEmail(trimmed) ? null : "Enter a valid email";
}

export function handleFieldError(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > CHANNEL_HANDLE_MAX_LENGTH) {
    return `${label} must be at most ${CHANNEL_HANDLE_MAX_LENGTH} characters`;
  }
  return null;
}

export function isIntegrationFieldEnabled(
  settings: IntegrationSettings,
  key: IntegrationFieldKey,
): boolean {
  return settings[key].enabled;
}

export function isIntegrationFieldRequired(
  settings: IntegrationSettings,
  key: IntegrationFieldKey,
): boolean {
  return settings[key].enabled && settings[key].requirement === FIELD_REQUIREMENT.Required;
}

export type MemberProfileInput = {
  name: string;
  position?: string;
  email: string;
  telegram: string;
  slack: string;
  wallets: TeamMemberWallets;
};

function requiredEmptyError(value: string, label: string, required: boolean): string | null {
  if (required && !value.trim()) return `${label} is required`;
  return null;
}

export function memberProfileError(
  input: MemberProfileInput,
  settings: IntegrationSettings,
): string | null {
  const name = input.name.trim();
  if (!name) return "Name is required";
  if (name.length > CONTACT_NAME_MAX_LENGTH) {
    return `Name must be at most ${CONTACT_NAME_MAX_LENGTH} characters`;
  }

  const position = (input.position ?? "").trim();
  if (position.length > CONTACT_NAME_MAX_LENGTH) {
    return `Position must be at most ${CONTACT_NAME_MAX_LENGTH} characters`;
  }

  const evmRequired = isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Evm);
  const evmError =
    requiredEmptyError(input.wallets.evm, "EVM wallet address", evmRequired)
    ?? walletFieldError(input.wallets.evm, "evm");
  if (evmError) return evmError;

  if (isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Solana)) {
    const error =
      requiredEmptyError(
        input.wallets.solana,
        "Solana wallet address",
        isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Solana),
      ) ?? walletFieldError(input.wallets.solana, "solana");
    if (error) return error;
  }

  if (isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Near)) {
    const error =
      requiredEmptyError(
        input.wallets.near,
        "NEAR wallet address",
        isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Near),
      ) ?? walletFieldError(input.wallets.near, "near");
    if (error) return error;
  }

  if (isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Tron)) {
    const error =
      requiredEmptyError(
        input.wallets.tron,
        "Tron wallet address",
        isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Tron),
      ) ?? walletFieldError(input.wallets.tron, "tron");
    if (error) return error;
  }

  if (isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Email)) {
    const error =
      requiredEmptyError(
        input.email,
        "Email",
        isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Email),
      ) ?? emailFieldError(input.email);
    if (error) return error;
  }

  if (isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Telegram)) {
    const error =
      requiredEmptyError(
        input.telegram,
        "Telegram",
        isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Telegram),
      ) ?? handleFieldError(input.telegram, "Telegram");
    if (error) return error;
  }

  if (isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Slack)) {
    const error =
      requiredEmptyError(
        input.slack,
        "Slack",
        isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Slack),
      ) ?? handleFieldError(input.slack, "Slack");
    if (error) return error;
  }

  return null;
}

export function teamMemberFormCanSave(
  input: MemberProfileInput,
  settings: IntegrationSettings,
): boolean {
  return memberProfileError(input, settings) == null;
}

export function organizationInviteUrl(origin: string, orgId: string): string {
  return `${origin}/invite/${encodeURIComponent(orgId)}`;
}
