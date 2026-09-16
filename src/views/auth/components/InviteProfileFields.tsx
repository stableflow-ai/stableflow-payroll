import {
  INTEGRATION_FIELD,
} from "@/hooks/use-settings-api";
import { CHANNEL_HANDLE_MAX_LENGTH } from "@/views/pay/components/setting/config";
import {
  handleFieldError,
  isIntegrationFieldEnabled,
  isIntegrationFieldRequired,
  walletFieldError,
} from "@/views/pay/components/team/utils";
import { CONTACT_NAME_MAX_LENGTH } from "@/views/pay/config";
import type { IntegrationSettings } from "@/types/organization";
import { nameRuleError } from "../config";
import { InviteField } from "./InviteField";

export type InviteProfileValues = {
  name: string;
  position: string;
  evm: string;
  solana: string;
  near: string;
  tron: string;
  telegram: string;
  slack: string;
};

function requiredValueError(value: string, label: string, required: boolean): string | null {
  if (required && !value.trim()) return `${label} is required`;
  return null;
}

function positionRuleError(position: string): string | null {
  const trimmed = position.trim();
  if (trimmed.length > CONTACT_NAME_MAX_LENGTH) {
    return `Position must be at most ${CONTACT_NAME_MAX_LENGTH} characters`;
  }
  return null;
}

export function inviteProfileFieldKeys(settings: IntegrationSettings): string[] {
  return [
    "name",
    "position",
    ...(isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Evm) ? ["evm"] : []),
    ...(isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Solana) ? ["solana"] : []),
    ...(isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Near) ? ["near"] : []),
    ...(isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Tron) ? ["tron"] : []),
    ...(isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Telegram) ? ["telegram"] : []),
    ...(isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Slack) ? ["slack"] : []),
  ];
}

export function InviteProfileFields(props: {
  settings: IntegrationSettings;
  values: InviteProfileValues;
  touched: Record<string, boolean>;
  onChange: (key: keyof InviteProfileValues, value: string) => void;
  onTouch: (key: string) => void;
  nameAutoFocus?: boolean;
}) {
  const { settings, values, touched, onChange, onTouch, nameAutoFocus = true } = props;
  const shown = touched;

  return (
    <>
      <InviteField
        id="profile-name"
        label="Name"
        value={values.name}
        onChange={(value) => {
          onTouch("name");
          onChange("name", value);
        }}
        onBlur={() => onTouch("name")}
        error={shown.name ? nameRuleError(values.name) : null}
        maxLength={CONTACT_NAME_MAX_LENGTH}
        autoFocus={nameAutoFocus}
      />
      <InviteField
        id="profile-position"
        label="Position"
        optional
        value={values.position}
        onChange={(value) => {
          onTouch("position");
          onChange("position", value);
        }}
        onBlur={() => onTouch("position")}
        error={shown.position ? positionRuleError(values.position) : null}
        maxLength={CONTACT_NAME_MAX_LENGTH}
        placeholder="E.g. PM, Engineer..."
      />
      {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Evm) ? (
        <InviteField
          id="profile-evm"
          label="EVM Wallet Address"
          optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Evm)}
          value={values.evm}
          onChange={(value) => {
            onTouch("evm");
            onChange("evm", value);
          }}
          onBlur={() => onTouch("evm")}
          error={
            shown.evm
              ? requiredValueError(
                values.evm,
                "EVM wallet address",
                isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Evm),
              ) ?? walletFieldError(values.evm, "evm")
              : null
          }
        />
      ) : null}
      {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Solana) ? (
        <InviteField
          id="profile-solana"
          label="SOLANA Wallet Address"
          optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Solana)}
          value={values.solana}
          onChange={(value) => {
            onTouch("solana");
            onChange("solana", value);
          }}
          onBlur={() => onTouch("solana")}
          error={
            shown.solana
              ? requiredValueError(
                values.solana,
                "SOLANA wallet address",
                isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Solana),
              ) ?? walletFieldError(values.solana, "solana")
              : null
          }
        />
      ) : null}
      {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Near) ? (
        <InviteField
          id="profile-near"
          label="NEAR Wallet Address"
          optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Near)}
          value={values.near}
          onChange={(value) => {
            onTouch("near");
            onChange("near", value);
          }}
          onBlur={() => onTouch("near")}
          error={
            shown.near
              ? requiredValueError(
                values.near,
                "NEAR wallet address",
                isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Near),
              ) ?? walletFieldError(values.near, "near")
              : null
          }
        />
      ) : null}
      {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Tron) ? (
        <InviteField
          id="profile-tron"
          label="TRON Wallet Address"
          optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Tron)}
          value={values.tron}
          onChange={(value) => {
            onTouch("tron");
            onChange("tron", value);
          }}
          onBlur={() => onTouch("tron")}
          error={
            shown.tron
              ? requiredValueError(
                values.tron,
                "TRON wallet address",
                isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Tron),
              ) ?? walletFieldError(values.tron, "tron")
              : null
          }
        />
      ) : null}
      {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Telegram) ? (
        <InviteField
          id="profile-telegram"
          label="Telegram"
          optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Telegram)}
          value={values.telegram}
          onChange={(value) => {
            onTouch("telegram");
            onChange("telegram", value);
          }}
          onBlur={() => onTouch("telegram")}
          maxLength={CHANNEL_HANDLE_MAX_LENGTH}
          error={
            shown.telegram
              ? requiredValueError(
                values.telegram,
                "Telegram",
                isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Telegram),
              ) ?? handleFieldError(values.telegram, "Telegram")
              : null
          }
        />
      ) : null}
      {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Slack) ? (
        <InviteField
          id="profile-slack"
          label="Slack ID"
          optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Slack)}
          value={values.slack}
          onChange={(value) => {
            onTouch("slack");
            onChange("slack", value);
          }}
          onBlur={() => onTouch("slack")}
          maxLength={CHANNEL_HANDLE_MAX_LENGTH}
          error={
            shown.slack
              ? requiredValueError(
                values.slack,
                "Slack",
                isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Slack),
              ) ?? handleFieldError(values.slack, "Slack")
              : null
          }
        />
      ) : null}
    </>
  );
}
