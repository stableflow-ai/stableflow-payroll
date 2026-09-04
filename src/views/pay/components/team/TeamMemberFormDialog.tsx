import { useEffect, useState, type ReactNode } from "react";
import { IconFieldError } from "@/components/icons/field-error";
import { Button } from "@/components/ui/button/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { cn } from "@/lib/utils";
import type { TeamMember, TeamMemberWrite } from "@/hooks/use-team-api";
import {
  defaultIntegrationSettings,
  INTEGRATION_FIELD,
  useIntegrationSettingsQuery,
} from "@/hooks/use-settings-api";
import { CONTACT_NAME_MAX_LENGTH, EMAIL_MAX_LENGTH } from "../../config";
import { CHANNEL_HANDLE_MAX_LENGTH } from "../setting/config";
import {
  emailFieldError,
  handleFieldError,
  isIntegrationFieldEnabled,
  isIntegrationFieldRequired,
  teamMemberFormCanSave,
  walletFieldError,
} from "./utils";

const FIELD_CLASS =
  "h-9 w-full rounded-[6px] border bg-[#f6f6f6] px-3 font-montserrat text-sm font-medium outline-none placeholder:text-black/30";

export function TeamMemberFormDialog(props: {
  open: boolean;
  onClose: () => void;
  member: TeamMember | null;
  onSave: (input: TeamMemberWrite) => void;
  saving?: boolean;
}) {
  const { open, onClose, member, onSave, saving = false } = props;
  const isEdit = Boolean(member);
  const settingsQuery = useIntegrationSettingsQuery();
  const settings = settingsQuery.data ?? defaultIntegrationSettings();
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [evm, setEvm] = useState("");
  const [solana, setSolana] = useState("");
  const [near, setNear] = useState("");
  const [tron, setTron] = useState("");
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [slack, setSlack] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(member?.name ?? "");
    setPosition(member?.position ?? "");
    setEvm(member?.wallets.evm ?? "");
    setSolana(member?.wallets.solana ?? "");
    setNear(member?.wallets.near ?? "");
    setTron(member?.wallets.tron ?? "");
    setEmail(member?.email ?? "");
    setTelegram(member?.telegram ?? "");
    setSlack(member?.slack ?? "");
  }, [open, member]);

  const wallets = { evm, solana, near, tron };
  const evmError = walletFieldError(evm, "evm")
    ?? (isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Evm) && !evm.trim()
      ? "EVM wallet address is required"
      : null);
  const solanaError = walletFieldError(solana, "solana");
  const nearError = walletFieldError(near, "near");
  const tronError = walletFieldError(tron, "tron");
  const emailError = emailFieldError(email);
  const telegramError = handleFieldError(telegram, "Telegram");
  const slackError = handleFieldError(slack, "Slack");
  const canSave =
    teamMemberFormCanSave(
      { name, position, email, telegram, slack, wallets },
      settings,
    ) && !saving;

  function handleSave() {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      position: position.trim(),
      email: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Email)
        ? email.trim()
        : (member?.email ?? ""),
      telegram: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Telegram)
        ? telegram.trim()
        : (member?.telegram ?? ""),
      slack: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Slack)
        ? slack.trim()
        : (member?.slack ?? ""),
      wallets: {
        evm: evm.trim(),
        solana: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Solana)
          ? solana.trim()
          : (member?.wallets.solana ?? ""),
        near: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Near)
          ? near.trim()
          : (member?.wallets.near ?? ""),
        tron: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Tron)
          ? tron.trim()
          : (member?.wallets.tron ?? ""),
      },
    });
  }

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? "Edit" : "Add"}>
      <Field label="Name">
        <input
          className={cn(FIELD_CLASS, "border-[#e3e3e3] text-black")}
          value={name}
          maxLength={CONTACT_NAME_MAX_LENGTH}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Field label="Position" optional>
        <input
          className={cn(FIELD_CLASS, "border-[#e3e3e3] text-black")}
          value={position}
          maxLength={CONTACT_NAME_MAX_LENGTH}
          placeholder="E.g. PM, Engineer..."
          onChange={(event) => setPosition(event.target.value)}
        />
      </Field>
      <WalletField
        label="EVM Wallet Address"
        value={evm}
        error={open && !evm.trim() ? null : evmError}
        onChange={setEvm}
      />
      {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Solana) ? (
        <WalletField
          label="Solana Wallet Address"
          optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Solana)}
          value={solana}
          error={solanaError}
          onChange={setSolana}
        />
      ) : null}
      {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Near) ? (
        <WalletField
          label="NEAR Wallet Address"
          optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Near)}
          value={near}
          error={nearError}
          onChange={setNear}
        />
      ) : null}
      {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Tron) ? (
        <WalletField
          label="Tron Wallet Address"
          optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Tron)}
          value={tron}
          error={tronError}
          onChange={setTron}
        />
      ) : null}
      {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Email) ? (
        <Field
          label="Email"
          optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Email)}
        >
          <input
            type="email"
            className={cn(
              FIELD_CLASS,
              emailError ? "border-[#ff5656] text-[#ff5656]" : "border-[#e3e3e3] text-black",
            )}
            value={email}
            maxLength={EMAIL_MAX_LENGTH}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
      ) : null}
      {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Telegram) ? (
        <Field
          label="Telegram"
          optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Telegram)}
        >
          <input
            className={cn(
              FIELD_CLASS,
              telegramError ? "border-[#ff5656] text-[#ff5656]" : "border-[#e3e3e3] text-black",
            )}
            value={telegram}
            maxLength={CHANNEL_HANDLE_MAX_LENGTH}
            onChange={(event) => setTelegram(event.target.value)}
          />
        </Field>
      ) : null}
      {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Slack) ? (
        <Field
          label="Slack"
          optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Slack)}
        >
          <input
            className={cn(
              FIELD_CLASS,
              slackError ? "border-[#ff5656] text-[#ff5656]" : "border-[#e3e3e3] text-black",
            )}
            value={slack}
            maxLength={CHANNEL_HANDLE_MAX_LENGTH}
            onChange={(event) => setSlack(event.target.value)}
          />
        </Field>
      ) : null}
      <Button size="lg" className="mt-8 w-full" disabled={!canSave} loading={saving} onClick={handleSave}>
        Save
      </Button>
    </Dialog>
  );
}

function Field(props: {
  label: string;
  optional?: boolean;
  children: ReactNode;
}) {
  const { label, optional, children } = props;
  return (
    <label className="mt-6 block first:mt-0">
      <span className="font-montserrat text-sm font-medium text-[#606060]">{label}</span>
      {optional ? (
        <span className="ml-1 font-montserrat text-xs font-medium text-[#aaa]">(optional)</span>
      ) : null}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function WalletField(props: {
  label: string;
  optional?: boolean;
  value: string;
  error: string | null;
  onChange: (value: string) => void;
}) {
  const { label, optional, value, error, onChange } = props;
  return (
    <Field label={label} optional={optional}>
      <div className="relative">
        <input
          className={cn(
            FIELD_CLASS,
            error ? "border-[#ff5656] pr-9 text-[#ff5656]" : "border-[#e3e3e3] text-black",
          )}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {error ? (
          <IconFieldError
            className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 text-[#ff5656]"
          />
        ) : null}
      </div>
    </Field>
  );
}
