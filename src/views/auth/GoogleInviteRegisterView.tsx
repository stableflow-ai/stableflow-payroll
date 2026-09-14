import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Icon2Right } from "@/components/icons/to-right";
import { Button } from "@/components/ui/button/Button";
import { integrationSettingsFromOrganization } from "@/api/organization";
import { useGoogleInviteRegisterMutation, useInvitePreviewQuery } from "@/hooks/use-invite-api";
import {
  defaultIntegrationSettings,
  INTEGRATION_FIELD,
} from "@/hooks/use-settings-api";
import useToast from "@/hooks/use-toast";
import { isIntegrationFieldEnabled, memberProfileError } from "@/views/pay/components/team/utils";
import { useGoogleAuthPendingStore } from "@/stores/google-auth-pending";
import { AuthShell } from "./AuthShell";
import { authErrorMessage, useTouchedFields } from "./auth-shared";
import {
  AUTH_LINK_ACCENT_CLASS,
  AUTH_LINK_CLASS,
  AUTH_ONBOARDING_FORM_CLASS,
} from "./config";
import {
  InviteProfileFields,
  inviteProfileFieldKeys,
  type InviteProfileValues,
} from "./components/InviteProfileFields";
import { useGoogleAuthPendingOrRedirect } from "./use-google-auth-pending";

const EMPTY_PROFILE: InviteProfileValues = {
  name: "",
  position: "",
  evm: "",
  solana: "",
  near: "",
  tron: "",
  telegram: "",
  slack: "",
};

export function GoogleInviteRegisterView() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const fallback = orgId ? `/invite/${encodeURIComponent(orgId)}` : "/login";
  const { pending, ready } = useGoogleAuthPendingOrRedirect(fallback);
  const clearPending = useGoogleAuthPendingStore((state) => state.clear);
  const previewQuery = useInvitePreviewQuery(orgId);
  const registerMutation = useGoogleInviteRegisterMutation();
  const profileTouched = useTouchedFields();
  const [profile, setProfile] = useState<InviteProfileValues>(EMPTY_PROFILE);

  const preview = previewQuery.data;
  const settings = preview ? integrationSettingsFromOrganization(preview) : defaultIntegrationSettings();
  const profileFieldKeys = inviteProfileFieldKeys(settings);

  useEffect(() => {
    if (!pending.name) return;
    setProfile((current) => (current.name ? current : { ...current, name: pending.name }));
  }, [pending.name]);

  const memberInput = {
    name: profile.name,
    position: profile.position,
    email: pending.email,
    telegram: profile.telegram,
    slack: profile.slack,
    wallets: {
      evm: profile.evm,
      solana: profile.solana,
      near: profile.near,
      tron: profile.tron,
    },
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!orgId || !pending.idToken) {
      toast.fail({ title: "Invite link is missing an organization" });
      return;
    }
    profileTouched.touchAll(profileFieldKeys);
    if (memberProfileError(memberInput, settings)) return;
    try {
      await registerMutation.mutateAsync({
        orgId,
        idToken: pending.idToken,
        name: profile.name.trim(),
        position: profile.position.trim() || undefined,
        evmAddress: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Evm)
          ? profile.evm.trim() || undefined
          : undefined,
        solanaAddress: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Solana)
          ? profile.solana.trim() || undefined
          : undefined,
        nearAddress: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Near)
          ? profile.near.trim() || undefined
          : undefined,
        tronAddress: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Tron)
          ? profile.tron.trim() || undefined
          : undefined,
        telegram: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Telegram)
          ? profile.telegram.trim() || undefined
          : undefined,
        slack: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Slack)
          ? profile.slack.trim() || undefined
          : undefined,
      });
      clearPending();
      navigate("/", { replace: true });
    } catch (cause) {
      toast.fail({
        title: authErrorMessage(cause, "Unable to create account"),
      });
    }
  };

  if (!ready || previewQuery.isPending) {
    return (
      <AuthShell>
        <p className="text-center font-montserrat text-sm text-[#909090]">Loading invite…</p>
      </AuthShell>
    );
  }

  if (previewQuery.isError || !preview) {
    return (
      <AuthShell>
        <p className="text-center font-montserrat text-sm text-danger">
          {previewQuery.error instanceof Error
            ? previewQuery.error.message
            : "Unable to load this invite"}
        </p>
        <p className={`mt-6 block ${AUTH_LINK_CLASS}`}>
          <Link to={fallback} className={`inline-flex items-center ${AUTH_LINK_ACCENT_CLASS}`}>
            <Icon2Right className="mr-1 rotate-180" />
            Back
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <form onSubmit={(event) => void submit(event)} className={AUTH_ONBOARDING_FORM_CLASS}>
        <Link
          to={fallback}
          className="self-start font-montserrat text-sm font-medium text-[#3f8afb] hover:text-[#3f8afb]/90"
        >
          Back
        </Link>
        <p className="mt-6 font-montserrat text-xs font-medium text-[#909090]">
          {preview.name}
        </p>
        <div className="mt-2 flex items-center gap-2">
          {preview.logo ? (
            <img
              src={preview.logo}
              alt=""
              className="h-6 min-w-6 max-w-20 shrink-0 object-contain"
            />
          ) : null}
          <span className="font-montserrat text-sm font-normal text-black">
            {pending.email || pending.name}
          </span>
        </div>
        <h1 className="mt-8 font-montserrat text-xl font-semibold text-black">Profile Setting</h1>
        <p className="mt-2.5 font-montserrat text-sm font-normal text-[#606060]">
          Set up a new account to start.
        </p>

        <InviteProfileFields
          settings={settings}
          values={profile}
          touched={profileTouched.touched}
          onChange={(key, value) => setProfile((current) => ({ ...current, [key]: value }))}
          onTouch={profileTouched.touch}
        />

        <Button
          type="submit"
          size="xl"
          loading={registerMutation.isPending}
          disabled={Boolean(memberProfileError(memberInput, settings))}
          className="mt-8 w-full"
        >
          Continue
        </Button>
      </form>
    </AuthShell>
  );
}
