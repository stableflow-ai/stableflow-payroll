import { type FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Icon2Right } from "@/components/icons/to-right";
import { Button } from "@/components/ui/button/Button";
import {
  defaultIntegrationSettings,
  INTEGRATION_FIELD,
} from "@/hooks/use-settings-api";
import { useInvitePreviewQuery, useInviteRegisterMutation } from "@/hooks/use-invite-api";
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
  inviteSignUpFormError,
} from "./config";

export function InviteRegisterView() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const previewQuery = useInvitePreviewQuery(orgId);
  const registerMutation = useInviteRegisterMutation();
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
  const settings = preview?.integration ?? defaultIntegrationSettings();

  const submitSignUp = (event: FormEvent) => {
    event.preventDefault();
    if (!orgId) {
      toast.fail({ title: "Invite link is missing an organization" });
      return;
    }
    const ruleError = inviteSignUpFormError(email, password, confirmPassword);
    if (ruleError) {
      toast.fail({ title: ruleError });
      return;
    }
    setStep(INVITE_STEP.Profile);
  };

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!orgId) {
      toast.fail({ title: "Invite link is missing an organization" });
      return;
    }
    const wallets = { evm, solana, near, tron };
    const memberEmail = email.trim();
    const ruleError = memberProfileError(
      { name, position, email: memberEmail, telegram, slack, wallets },
      settings,
    );
    if (ruleError) {
      toast.fail({ title: ruleError });
      return;
    }
    try {
      await registerMutation.mutateAsync({
        orgId,
        name: name.trim(),
        email: memberEmail,
        password,
        position: position.trim() || undefined,
        telegram: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Telegram)
          ? telegram.trim()
          : undefined,
        slack: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Slack)
          ? slack.trim()
          : undefined,
        wallets: {
          evm: evm.trim(),
          solana: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Solana) ? solana.trim() : "",
          near: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Near) ? near.trim() : "",
          tron: isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Tron) ? tron.trim() : "",
        },
      });
      navigate("/", { replace: true });
    } catch (cause) {
      toast.fail({
        title: authErrorMessage(cause, "Unable to create account"),
      });
    }
  };

  if (step === INVITE_STEP.Profile && preview) {
    return (
      <AuthShell>
        <form onSubmit={(event) => void submitProfile(event)} className={AUTH_ONBOARDING_FORM_CLASS}>
          <p className="font-montserrat text-xs font-medium text-[#909090]">
            {preview.organizationName}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <img
              src={preview.inviterAvatar}
              alt=""
              className="size-5 shrink-0 rounded-full object-cover"
            />
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
            onChange={setName}
            maxLength={CONTACT_NAME_MAX_LENGTH}
            autoFocus
          />
          <InviteField
            id="profile-position"
            label="Position"
            optional
            value={position}
            onChange={setPosition}
            maxLength={CONTACT_NAME_MAX_LENGTH}
            placeholder="E.g. PM, Engineer..."
          />
          <InviteField
            id="profile-evm"
            label="EVM Wallet Address"
            value={evm}
            onChange={setEvm}
            error={walletFieldError(evm, "evm")}
          />
          {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Solana) ? (
            <InviteField
              id="profile-solana"
              label="Solana Wallet Address"
              optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Solana)}
              value={solana}
              onChange={setSolana}
              error={walletFieldError(solana, "solana")}
            />
          ) : null}
          {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Near) ? (
            <InviteField
              id="profile-near"
              label="NEAR Wallet Address"
              optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Near)}
              value={near}
              onChange={setNear}
              error={walletFieldError(near, "near")}
            />
          ) : null}
          {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Tron) ? (
            <InviteField
              id="profile-tron"
              label="Tron Wallet Address"
              optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Tron)}
              value={tron}
              onChange={setTron}
              error={walletFieldError(tron, "tron")}
            />
          ) : null}
          {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Telegram) ? (
            <InviteField
              id="profile-telegram"
              label="Telegram"
              optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Telegram)}
              value={telegram}
              onChange={setTelegram}
              maxLength={CHANNEL_HANDLE_MAX_LENGTH}
              error={handleFieldError(telegram, "Telegram")}
            />
          ) : null}
          {isIntegrationFieldEnabled(settings, INTEGRATION_FIELD.Slack) ? (
            <InviteField
              id="profile-slack"
              label="Slack"
              optional={!isIntegrationFieldRequired(settings, INTEGRATION_FIELD.Slack)}
              value={slack}
              onChange={setSlack}
              maxLength={CHANNEL_HANDLE_MAX_LENGTH}
              error={handleFieldError(slack, "Slack")}
            />
          ) : null}

          <Button
            type="submit"
            size="xl"
            loading={registerMutation.isPending}
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
        {previewQuery.isPending ? (
          <p className="text-center font-montserrat text-sm text-[#909090]">Loading invite…</p>
        ) : previewQuery.isError ? (
          <p className="text-center font-montserrat text-sm text-danger">
            {previewQuery.error instanceof Error
              ? previewQuery.error.message
              : "Unable to load this invite"}
          </p>
        ) : preview ? (
          <>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <img
                  src={preview.inviterAvatar}
                  alt=""
                  className="size-5 shrink-0 rounded-full object-cover"
                />
                <span className="font-montserrat text-sm font-medium text-black">
                  {preview.inviterEmail}
                </span>
              </div>
              <h1 className="mt-3 text-center font-montserrat text-xl font-semibold text-black">
                Invites you to join {preview.organizationName}
              </h1>
            </div>

            <AuthField
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@company.com"
              autoFocus
              autoComplete="email"
              maxLength={EMAIL_MAX_LENGTH}
            />
            <AuthPasswordField
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
            />
            <AuthPasswordField
              id="confirm-password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Keep the same with the new password"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
            />

            <Button type="submit" size="lg" className="mt-6 w-full">
              Sign up
            </Button>
          </>
        ) : null}

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
  optional?: boolean;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  error?: string | null;
}) {
  const { id, label, value, onChange, optional, placeholder, maxLength, autoFocus, error } = props;
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
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
      />
    </div>
  );
}
