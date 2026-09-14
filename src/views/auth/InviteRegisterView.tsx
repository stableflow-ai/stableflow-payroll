import { type FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Icon2Right } from "@/components/icons/to-right";
import { Button } from "@/components/ui/button/Button";
import { integrationSettingsFromOrganization } from "@/api/organization";
import { useInvitePreviewQuery, useInviteRegisterMutation } from "@/hooks/use-invite-api";
import {
  defaultIntegrationSettings,
  INTEGRATION_FIELD,
} from "@/hooks/use-settings-api";
import useToast from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CHANNEL_HANDLE_MAX_LENGTH } from "@/views/pay/components/setting/config";
import {
  handleFieldError,
  isIntegrationFieldEnabled,
  isIntegrationFieldRequired,
  memberProfileError,
  walletFieldError,
} from "@/views/pay/components/team/utils";
import { CONTACT_NAME_MAX_LENGTH } from "@/views/pay/config";
import { AuthShell } from "./AuthShell";
import {
  AuthField,
  AuthPasswordField,
  authErrorMessage,
  AUTH_FORM_CLASS,
  useTouchedFields,
} from "./auth-shared";
import {
  AUTH_COMPACT_INPUT_CLASS,
  AUTH_LINK_ACCENT_CLASS,
  AUTH_LINK_CLASS,
  AUTH_ONBOARDING_FORM_CLASS,
  AUTH_ONBOARDING_LABEL_CLASS,
  EMAIL_MAX_LENGTH,
  INVITE_STEP,
  PASSWORD_MAX_LENGTH,
  confirmPasswordRuleError,
  emailRuleError,
  inviteSignUpFormError,
  nameRuleError,
  passwordRuleError,
} from "./config";

const SIGN_UP_FIELDS = ["email", "password", "confirmPassword"] as const;

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
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [evm, setEvm] = useState("");
  const [solana, setSolana] = useState("");
  const [near, setNear] = useState("");
  const [tron, setTron] = useState("");
  const [telegram, setTelegram] = useState("");
  const [slack, setSlack] = useState("");

  const preview = previewQuery.data;
  const settings = preview ? integrationSettingsFromOrganization(preview) : defaultIntegrationSettings();

  const profileFieldKeys = [
    "name",
    "position",
    ...(isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Evm) ? ["evm"] : []),
    ...(isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Solana) ? ["solana"] : []),
    ...(isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Near) ? ["near"] : []),
    ...(isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Tron) ? ["tron"] : []),
    ...(isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Telegram) ? ["telegram"] : []),
    ...(isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Slack) ? ["slack"] : []),
  ];

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
    const wallets = { evm, solana, near, tron };
    const memberEmail = email.trim();
    if (memberProfileError(
      { name, position, email: memberEmail, telegram, slack, wallets },
      settings,
    )) return;
    try {
      await registerMutation.mutateAsync({
        orgId,
        name: name.trim(),
        email: memberEmail,
        password,
        position: position.trim() || undefined,
        evmAddress: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Evm)
          ? evm.trim() || undefined
          : undefined,
        solanaAddress: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Solana)
          ? solana.trim() || undefined
          : undefined,
        nearAddress: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Near)
          ? near.trim() || undefined
          : undefined,
        tronAddress: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Tron)
          ? tron.trim() || undefined
          : undefined,
        telegram: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Telegram)
          ? telegram.trim() || undefined
          : undefined,
        slack: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Slack)
          ? slack.trim() || undefined
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
    const shown = profileTouched.touched;
    return (
      <AuthShell>
        <form onSubmit={(event) => void submitProfile(event)} className={AUTH_ONBOARDING_FORM_CLASS}>
          <button
            type="button"
            onClick={() => setStep(INVITE_STEP.SignUp)}
            className="self-start font-montserrat text-sm font-medium text-[#3f8afb] hover:text-[#3f8afb]/90"
          >
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
          <p className="mt-2.5 font-montserrat text-sm font-normal text-[#606060]">
            Set up a new account to start.
          </p>

          <InviteField
            id="profile-name"
            label="Name"
            value={name}
            onChange={(value) => {
              profileTouched.touch("name");
              setName(value);
            }}
            onBlur={() => profileTouched.touch("name")}
            error={shown.name ? nameRuleError(name) : null}
            maxLength={CONTACT_NAME_MAX_LENGTH}
            autoFocus
          />
          <InviteField
            id="profile-position"
            label="Position"
            optional
            value={position}
            onChange={(value) => {
              profileTouched.touch("position");
              setPosition(value);
            }}
            onBlur={() => profileTouched.touch("position")}
            error={shown.position ? positionRuleError(position) : null}
            maxLength={CONTACT_NAME_MAX_LENGTH}
            placeholder="E.g. PM, Engineer..."
          />
          {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Evm) ? (
            <InviteField
              id="profile-evm"
              label="EVM Wallet Address"
              optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Evm)}
              value={evm}
              onChange={(value) => {
                profileTouched.touch("evm");
                setEvm(value);
              }}
              onBlur={() => profileTouched.touch("evm")}
              error={
                shown.evm
                  ? requiredValueError(
                    evm,
                    "EVM wallet address",
                    isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Evm),
                  ) ?? walletFieldError(evm, "evm")
                  : null
              }
            />
          ) : null}
          {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Solana) ? (
            <InviteField
              id="profile-solana"
              label="Solana Wallet Address"
              optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Solana)}
              value={solana}
              onChange={(value) => {
                profileTouched.touch("solana");
                setSolana(value);
              }}
              onBlur={() => profileTouched.touch("solana")}
              error={
                shown.solana
                  ? requiredValueError(
                    solana,
                    "Solana wallet address",
                    isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Solana),
                  ) ?? walletFieldError(solana, "solana")
                  : null
              }
            />
          ) : null}
          {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Near) ? (
            <InviteField
              id="profile-near"
              label="NEAR Wallet Address"
              optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Near)}
              value={near}
              onChange={(value) => {
                profileTouched.touch("near");
                setNear(value);
              }}
              onBlur={() => profileTouched.touch("near")}
              error={
                shown.near
                  ? requiredValueError(
                    near,
                    "NEAR wallet address",
                    isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Near),
                  ) ?? walletFieldError(near, "near")
                  : null
              }
            />
          ) : null}
          {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Tron) ? (
            <InviteField
              id="profile-tron"
              label="Tron Wallet Address"
              optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Tron)}
              value={tron}
              onChange={(value) => {
                profileTouched.touch("tron");
                setTron(value);
              }}
              onBlur={() => profileTouched.touch("tron")}
              error={
                shown.tron
                  ? requiredValueError(
                    tron,
                    "Tron wallet address",
                    isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Tron),
                  ) ?? walletFieldError(tron, "tron")
                  : null
              }
            />
          ) : null}
          {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Telegram) ? (
            <InviteField
              id="profile-telegram"
              label="Telegram"
              optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Telegram)}
              value={telegram}
              onChange={(value) => {
                profileTouched.touch("telegram");
                setTelegram(value);
              }}
              onBlur={() => profileTouched.touch("telegram")}
              maxLength={CHANNEL_HANDLE_MAX_LENGTH}
              error={
                shown.telegram
                  ? requiredValueError(
                    telegram,
                    "Telegram",
                    isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Telegram),
                  ) ?? handleFieldError(telegram, "Telegram")
                  : null
              }
            />
          ) : null}
          {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Slack) ? (
            <InviteField
              id="profile-slack"
              label="Slack"
              optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Slack)}
              value={slack}
              onChange={(value) => {
                profileTouched.touch("slack");
                setSlack(value);
              }}
              onBlur={() => profileTouched.touch("slack")}
              maxLength={CHANNEL_HANDLE_MAX_LENGTH}
              error={
                shown.slack
                  ? requiredValueError(
                    slack,
                    "Slack",
                    isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Slack),
                  ) ?? handleFieldError(slack, "Slack")
                  : null
              }
            />
          ) : null}

          <Button
            type="submit"
            size="xl"
            loading={registerMutation.isPending}
            disabled={Boolean(
              memberProfileError(
                { name, position, email: email.trim(), telegram, slack, wallets: { evm, solana, near, tron } },
                settings,
              ),
            )}
            className="mt-8 w-full"
          >
            Continue
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <form onSubmit={submitSignUp} className={AUTH_FORM_CLASS}>
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
        />

        <Button
          type="submit"
          size="lg"
          disabled={Boolean(inviteSignUpFormError(email, password, confirmPassword))}
          className="mt-6 w-full"
        >
          Sign up
        </Button>

        <p className={`block ${AUTH_LINK_CLASS}`}>
          Already have an account.{" "}
          <Link to="/login" className={`inline-flex items-center ${AUTH_LINK_ACCENT_CLASS}`}>
            Login
            <Icon2Right className="ml-1" />
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

function InviteField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  optional?: boolean;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  error?: string | null;
}) {
  const { id, label, value, onChange, onBlur, optional, placeholder, maxLength, autoFocus, error } = props;
  return (
    <div className="mt-6">
      <label htmlFor={id} className={AUTH_ONBOARDING_LABEL_CLASS}>
        {label}
        {optional ? (
          <span className="ml-1 font-montserrat text-xs font-medium text-[#aaa]">(optional)</span>
        ) : null}
      </label>
      <input
        id={id}
        className={cn(AUTH_COMPACT_INPUT_CLASS, "mt-2", error && "border-[#ff5656] text-[#ff5656]")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 font-montserrat text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
