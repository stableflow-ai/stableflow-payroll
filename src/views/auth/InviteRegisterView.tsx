import { type FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Icon2Right } from "@stableflow/pay-ui/icons/to-right";
import { Button } from "@stableflow/pay-ui/button";
import { integrationSettingsFromOrganization } from "@/api/organization";
import { useInvitePreviewQuery, useInviteRegisterMutation } from "@/hooks/use-invite-api";
import {
  defaultIntegrationSettings,
  INTEGRATION_FIELD,
} from "@/hooks/use-settings-api";
import useToast from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { isIntegrationFieldEnabled, memberProfileError } from "@/views/pay/components/team/utils";
import { AuthShell } from "./AuthShell";
import {
  AuthField,
  AuthPasswordField,
  authErrorMessage,
  AUTH_FORM_CLASS,
  useTouchedFields,
} from "./auth-shared";
import {
  AUTH_LINK_ACCENT_CLASS,
  AUTH_LINK_CLASS,
  AUTH_ONBOARDING_FORM_CLASS,
  EMAIL_MAX_LENGTH,
  INVITE_STEP,
  PASSWORD_MAX_LENGTH,
  confirmPasswordRuleError,
  emailRuleError,
  inviteSignUpFormError,
  passwordRuleError,
} from "./config";
import { GoogleSignInSection } from "./components/GoogleSignInSection";
import {
  InviteProfileFields,
  inviteProfileFieldKeys,
  type InviteProfileValues,
} from "./components/InviteProfileFields";

const SIGN_UP_FIELDS = ["email", "password", "confirmPassword"] as const;

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

export function InviteRegisterView() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const previewQuery = useInvitePreviewQuery(orgId);
  const registerMutation = useInviteRegisterMutation();
  const signUpTouched = useTouchedFields();
  const profileTouched = useTouchedFields();
  const [step, setStep] = useState<(typeof INVITE_STEP)[keyof typeof INVITE_STEP]>(INVITE_STEP.SignUp);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profile, setProfile] = useState<InviteProfileValues>(EMPTY_PROFILE);

  const preview = previewQuery.data;
  const settings = preview ? integrationSettingsFromOrganization(preview) : defaultIntegrationSettings();

  const profileFieldKeys = inviteProfileFieldKeys(settings);

  const submitSignUp = (event: FormEvent) => {
    event.preventDefault();
    if (!orgId) {
      toast.fail({ title: "Invite link is missing an organization" });
      return;
    }
    signUpTouched.touchAll(SIGN_UP_FIELDS);
    if (inviteSignUpFormError(email, password, confirmPassword)) return;
    setStep(INVITE_STEP.Profile);
  };

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!orgId) {
      toast.fail({ title: "Invite link is missing an organization" });
      return;
    }
    profileTouched.touchAll(profileFieldKeys);
    const wallets = { evm: profile.evm, solana: profile.solana, near: profile.near, tron: profile.tron };
    const memberEmail = email.trim();
    if (memberProfileError(
      { name: profile.name, position: profile.position, email: memberEmail, telegram: profile.telegram, slack: profile.slack, wallets },
      settings,
    )) return;
    try {
      await registerMutation.mutateAsync({
        orgId,
        name: profile.name.trim(),
        email: memberEmail,
        password,
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
      navigate("/", { replace: true });
    } catch (cause) {
      toast.fail({
        title: authErrorMessage(cause, "Unable to create account"),
      });
    }
  };

  if (previewQuery.isPending) {
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
          Already have an account.{" "}
          <Link to="/login" className={`inline-flex items-center ${AUTH_LINK_ACCENT_CLASS}`}>
            Login
            <Icon2Right className="ml-1" />
          </Link>
        </p>
      </AuthShell>
    );
  }

  if (step === INVITE_STEP.Profile) {
    return (
      <AuthShell>
        <form onSubmit={(event) => void submitProfile(event)} className={AUTH_ONBOARDING_FORM_CLASS}>
          <button
            type="button"
            onClick={() => setStep(INVITE_STEP.SignUp)}
            className="self-start flex items-center gap-2 font-montserrat text-sm font-medium text-[#3f8afb] hover:text-[#3f8afb]/90"
          >
            <Icon2Right className="rotate-180 text-[#606060]" />
            Back
          </button>
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
            <span className="font-montserrat text-sm font-normal text-black">{email.trim()}</span>
          </div>
          <h1 className="mt-8 font-montserrat text-xl font-semibold text-black">Profile Setting</h1>
          <p className="mt-2.5 mb-5 font-montserrat text-sm font-normal text-[#606060]">
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
            disabled={Boolean(
              memberProfileError(
                {
                  name: profile.name,
                  position: profile.position,
                  email: email.trim(),
                  telegram: profile.telegram,
                  slack: profile.slack,
                  wallets: {
                    evm: profile.evm,
                    solana: profile.solana,
                    near: profile.near,
                    tron: profile.tron,
                  },
                },
                settings,
              ),
            )}
            className="mt-7.5 w-full"
          >
            Continue
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center">
        {preview.logo ? (
          <img
            src={preview.logo}
            alt=""
            className="h-8 min-w-8 max-w-24 shrink-0 object-contain"
          />
        ) : null}
        <h1 className={cn("text-center font-montserrat text-xl font-semibold text-black", preview.logo && "mt-3")}>
          Invites you to join {preview.name}
        </h1>
      </div>
      <form onSubmit={submitSignUp} className={AUTH_FORM_CLASS}>
        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(value) => {
            signUpTouched.touch("email");
            setEmail(value);
          }}
          onBlur={() => signUpTouched.touch("email")}
          error={signUpTouched.touched.email ? emailRuleError(email) : null}
          placeholder="you@company.com"
          autoFocus
          autoComplete="email"
          maxLength={EMAIL_MAX_LENGTH}
        />
        <AuthPasswordField
          id="password"
          label="Password"
          value={password}
          onChange={(value) => {
            signUpTouched.touch("password");
            setPassword(value);
          }}
          onBlur={() => signUpTouched.touch("password")}
          error={signUpTouched.touched.password ? passwordRuleError(password) : null}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          className="mt-5"
        />
        <AuthPasswordField
          id="confirm-password"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(value) => {
            signUpTouched.touch("confirmPassword");
            setConfirmPassword(value);
          }}
          onBlur={() => signUpTouched.touch("confirmPassword")}
          error={
            signUpTouched.touched.confirmPassword
              ? confirmPasswordRuleError(password, confirmPassword)
              : null
          }
          placeholder="Keep the same with the new password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          className="mt-5"
        />

        <Button
          type="submit"
          size="lg"
          disabled={Boolean(inviteSignUpFormError(email, password, confirmPassword))}
          className="mt-7.5 w-full"
        >
          Sign up
        </Button>

        <GoogleSignInSection orgId={orgId} />

        <p className={`block ${AUTH_LINK_CLASS}`}>
          Already have an account.{" "}
          <Link to="/login" className={`inline-flex items-center ${AUTH_LINK_ACCENT_CLASS}`}>
            Login
            <Icon2Right className="ml-1 text-[#606060]" />
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
