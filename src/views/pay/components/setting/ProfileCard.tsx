import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE } from "@/components/ui/button/config";
import { Card } from "@/components/ui/card/Card";
import {
  useUpdateMemberProfileMutation,
  useUpdateProfileMutation,
} from "@/hooks/use-auth-api";
import {
  defaultIntegrationSettings,
  INTEGRATION_FIELD,
  useIntegrationSettingsQuery,
} from "@/hooks/use-settings-api";
import useToast from "@/hooks/use-toast";
import { isUser, organizationId } from "@/lib/auth-role";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import type { AuthTeamMember } from "@/types/auth";
import { ResetPasswordDialog } from "@/views/auth/ResetPasswordDialog";
import { RESET_PASSWORD_VARIANT, nameRuleError } from "@/views/auth/config";
import { CONTACT_NAME_MAX_LENGTH } from "../../config";
import { CHANNEL_HANDLE_MAX_LENGTH } from "./config";
import {
  handleFieldError,
  isIntegrationFieldEnabled,
  isIntegrationFieldRequired,
  memberProfileError,
  walletFieldError,
} from "../team/utils";

const FIELD_CLASS =
  "h-10 w-full rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-3 font-montserrat text-sm font-medium text-black outline-none placeholder:text-black/30";

export function ProfileCard() {
  const toast = useToast();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const applySession = useAuthStore((state) => state.applySession);
  const updateMutation = useUpdateProfileMutation();
  const memberUpdateMutation = useUpdateMemberProfileMutation();
  const isMember = isUser(user);
  const settingsQuery = useIntegrationSettingsQuery();
  const settings = settingsQuery.data ?? defaultIntegrationSettings();
  const teamMember = user?.teamMember;
  const [name, setName] = useState(user?.name ?? "");
  const [position, setPosition] = useState(teamMember?.position ?? "");
  const [evm, setEvm] = useState(teamMember?.wallets.evm ?? "");
  const [solana, setSolana] = useState(teamMember?.wallets.solana ?? "");
  const [near, setNear] = useState(teamMember?.wallets.near ?? "");
  const [tron, setTron] = useState(teamMember?.wallets.tron ?? "");
  const [telegram, setTelegram] = useState(teamMember?.telegram ?? "");
  const [slack, setSlack] = useState(teamMember?.slack ?? "");
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setPosition(teamMember?.position ?? "");
    setEvm(teamMember?.wallets.evm ?? "");
    setSolana(teamMember?.wallets.solana ?? "");
    setNear(teamMember?.wallets.near ?? "");
    setTron(teamMember?.wallets.tron ?? "");
    setTelegram(teamMember?.telegram ?? "");
    setSlack(teamMember?.slack ?? "");
  }, [user?.name, teamMember]);

  const wallets = { evm, solana, near, tron };
  const evmError = walletFieldError(evm, "evm");
  const solanaError = walletFieldError(solana, "solana");
  const nearError = walletFieldError(near, "near");
  const tronError = walletFieldError(tron, "tron");
  const telegramError = handleFieldError(telegram, "Telegram");
  const slackError = handleFieldError(slack, "Slack");
  const saving = updateMutation.isPending || memberUpdateMutation.isPending;

  async function handleSave() {
    const trimmed = name.trim();
    const error = nameRuleError(trimmed);
    if (error) {
      toast.fail({ title: error });
      return;
    }
    if (!token || !user) return;
    if (isMember) {
      const profileError = memberProfileError(
        {
          name: trimmed,
          position,
          email: user.email,
          telegram,
          slack,
          wallets,
        },
        settings,
      );
      if (profileError) {
        toast.fail({ title: profileError });
        return;
      }
      const orgId = organizationId(user);
      if (orgId == null) {
        toast.fail({ title: "Organization is missing" });
        return;
      }
      const nextTeamMember: AuthTeamMember = {
        name: trimmed,
        position: position.trim(),
        email: user.email,
        telegram: telegram.trim(),
        slack: slack.trim(),
        wallets: {
          evm: evm.trim(),
          solana: solana.trim(),
          near: near.trim(),
          tron: tron.trim(),
        },
      };
      try {
        if (!token.startsWith("mock:")) {
          await memberUpdateMutation.mutateAsync({
            name: trimmed,
            organizationId: orgId,
            position: nextTeamMember.position,
            telegram: nextTeamMember.telegram,
            slack: nextTeamMember.slack,
            wallets: nextTeamMember.wallets,
          });
        }
        applySession(token, { ...user, name: trimmed, teamMember: nextTeamMember });
        toast.success({ title: "Profile saved" });
      } catch (cause) {
        toast.fail({
          title: cause instanceof Error ? cause.message : "Failed to save profile",
        });
      }
      return;
    }
    try {
      if (!token.startsWith("mock:")) {
        await updateMutation.mutateAsync({ name: trimmed });
      }
      applySession(token, { ...user, name: trimmed });
      toast.success({ title: "Profile saved" });
    } catch (cause) {
      toast.fail({
        title: cause instanceof Error ? cause.message : "Failed to save profile",
      });
    }
  }

  return (
    <Card className="flex flex-col p-[30px]">
      <h2 className="font-montserrat text-xl font-medium capitalize text-black">Profile</h2>
      <p className="mt-2 font-montserrat text-sm font-normal text-[#909090]">Update your profile</p>
      <ProfileField label="Name">
        <input
          className={FIELD_CLASS}
          value={name}
          maxLength={CONTACT_NAME_MAX_LENGTH}
          onChange={(event) => setName(event.target.value)}
        />
      </ProfileField>
      <div className="mt-6">
        <span className="font-montserrat text-sm font-medium text-[#606060]">Account Email</span>
        <div className="relative mt-2">
          <p className={cn(
            FIELD_CLASS,
            "border-0 bg-transparent",
            "flex items-center pr-32",
          )}>{user?.email}</p>
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 font-montserrat text-xs font-medium capitalize text-[#3f8afb] hover:opacity-80"
            onClick={() => setResetOpen(true)}
          >
            Reset Password
          </button>
        </div>
      </div>
      {isMember ? (
        <>
          <ProfileField label="Position" optional>
            <input
              className={FIELD_CLASS}
              value={position}
              maxLength={CONTACT_NAME_MAX_LENGTH}
              placeholder="E.g. PM, Engineer..."
              onChange={(event) => setPosition(event.target.value)}
            />
          </ProfileField>
          <ProfileField
            label="EVM Wallet Address"
            optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Evm)}
          >
            <input
              className={cn(FIELD_CLASS, evmError && "border-[#ff5656] text-[#ff5656]")}
              value={evm}
              onChange={(event) => setEvm(event.target.value)}
            />
          </ProfileField>
          {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Solana) ? (
            <ProfileField
              label="Solana Wallet Address"
              optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Solana)}
            >
              <input
                className={cn(FIELD_CLASS, solanaError && "border-[#ff5656] text-[#ff5656]")}
                value={solana}
                onChange={(event) => setSolana(event.target.value)}
              />
            </ProfileField>
          ) : null}
          {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Near) ? (
            <ProfileField
              label="NEAR Wallet Address"
              optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Near)}
            >
              <input
                className={cn(FIELD_CLASS, nearError && "border-[#ff5656] text-[#ff5656]")}
                value={near}
                onChange={(event) => setNear(event.target.value)}
              />
            </ProfileField>
          ) : null}
          {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Tron) ? (
            <ProfileField
              label="Tron Wallet Address"
              optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Tron)}
            >
              <input
                className={cn(FIELD_CLASS, tronError && "border-[#ff5656] text-[#ff5656]")}
                value={tron}
                onChange={(event) => setTron(event.target.value)}
              />
            </ProfileField>
          ) : null}
          {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Telegram) ? (
            <ProfileField
              label="Telegram"
              optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Telegram)}
            >
              <input
                className={cn(FIELD_CLASS, telegramError && "border-[#ff5656] text-[#ff5656]")}
                value={telegram}
                maxLength={CHANNEL_HANDLE_MAX_LENGTH}
                onChange={(event) => setTelegram(event.target.value)}
              />
            </ProfileField>
          ) : null}
          {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Slack) ? (
            <ProfileField
              label="Slack"
              optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Slack)}
            >
              <input
                className={cn(FIELD_CLASS, slackError && "border-[#ff5656] text-[#ff5656]")}
                value={slack}
                maxLength={CHANNEL_HANDLE_MAX_LENGTH}
                onChange={(event) => setSlack(event.target.value)}
              />
            </ProfileField>
          ) : null}
        </>
      ) : null}
      <div className="mt-6 flex justify-end">
        <Button
          size={BUTTON_SIZE.Sm}
          className="h-9 min-w-[120px] rounded-[8px] px-4"
          loading={saving}
          onClick={() => void handleSave()}
        >
          Save
        </Button>
      </div>
      <ResetPasswordDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        variant={RESET_PASSWORD_VARIANT.Authed}
      />
    </Card>
  );
}

function ProfileField(props: {
  label: string;
  optional?: boolean;
  children: ReactNode;
}) {
  const { label, optional, children } = props;
  return (
    <label className="mt-6 block">
      <span className="font-montserrat text-sm font-medium text-[#606060]">{label}</span>
      {optional ? (
        <span className="ml-1 font-montserrat text-xs font-medium text-[#909090]">(optional)</span>
      ) : null}
      <div className="mt-2">{children}</div>
    </label>
  );
}
