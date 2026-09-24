import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@stableflow/pay-ui/button";
import { Icon2Right } from "@stableflow/pay-ui/icons/to-right";
import { useRegisterMutation } from "@/hooks/use-auth-api";
import useToast from "@/hooks/use-toast";
import { AuthShell } from "./AuthShell";
import {
  AuthBetaBanner,
  AuthField,
  AuthPasswordField,
  authErrorMessage,
  AUTH_COMPACT_INPUT_CLASS,
  AUTH_FORM_CLASS,
  useTouchedFields,
} from "./auth-shared";
import {
  AUTH_LINK_ACCENT_CLASS,
  AUTH_LINK_CLASS,
  AUTH_ONBOARDING_FORM_CLASS,
  AUTH_ONBOARDING_LABEL_CLASS,
  EMAIL_MAX_LENGTH,
  INVITE_CODE_MAX_LENGTH,
  LOGO_URL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  ORGANIZATION_NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  REGISTER_STEP,
  confirmPasswordRuleError,
  createOrganizationFormError,
  emailRuleError,
  inviteCodeRuleError,
  logoUrlRuleError,
  nameRuleError,
  organizationNameRuleError,
  passwordRuleError,
  registerFormError,
} from "./config";
import { loginPathWithReturnTo, postAuthPath, returnToFromSearch } from "./return-to";

const SIGN_UP_FIELDS = ["name", "email", "password", "confirmPassword", "inviteCode"] as const;
const ORGANIZATION_FIELDS = ["organizationName", "logoUrl"] as const;

export function RegisterView() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = returnToFromSearch(params.toString());
  const toast = useToast();
  const registerMutation = useRegisterMutation();
  const signUpTouched = useTouchedFields();
  const organizationTouched = useTouchedFields();

  const [step, setStep] = useState<(typeof REGISTER_STEP)[keyof typeof REGISTER_STEP]>(
    REGISTER_STEP.SignUp,
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const submitSignUp = (event: FormEvent) => {
    event.preventDefault();
    signUpTouched.touchAll(SIGN_UP_FIELDS);
    if (registerFormError(name, email, password, confirmPassword, inviteCode)) return;
    setStep(REGISTER_STEP.Organization);
  };

  const submitOrganization = async (event: FormEvent) => {
    event.preventDefault();
    organizationTouched.touchAll(ORGANIZATION_FIELDS);
    if (createOrganizationFormError(organizationName, logoUrl)) return;
    const logo = logoUrl.trim();
    try {
      const session = await registerMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
        inviteCode: inviteCode.trim(),
        organization: logo
          ? { name: organizationName.trim(), logo }
          : { name: organizationName.trim() },
      });
      navigate(postAuthPath(session.user, returnTo), { replace: true });
    } catch (cause) {
      toast.fail({
        title: authErrorMessage(cause, "Unable to create account"),
      });
      setStep(REGISTER_STEP.SignUp);
    }
  };

  if (step === REGISTER_STEP.Organization) {
    return (
      <AuthShell>
        <form
          onSubmit={(event) => void submitOrganization(event)}
          className={AUTH_ONBOARDING_FORM_CLASS}
        >
          <button
            type="button"
            onClick={() => setStep(REGISTER_STEP.SignUp)}
            className="self-start flex items-center gap-2 font-montserrat text-sm font-medium text-[#3f8afb] hover:text-[#3f8afb]/90"
          >
            <Icon2Right className="text-[#606060] rotate-180" />
            Back
          </button>
          <h1 className="mt-6 font-montserrat text-xl font-semibold text-black">
            A few quick questions to get you started
          </h1>
          <p className="mt-2.5 font-montserrat text-sm font-normal text-[#606060]">
            Tell us more about your organization
          </p>

          <AuthField
            id="organization-name"
            label="Organization Name"
            value={organizationName}
            onChange={(value) => {
              organizationTouched.touch("organizationName");
              setOrganizationName(value);
            }}
            onBlur={() => organizationTouched.touch("organizationName")}
            error={
              organizationTouched.touched.organizationName
                ? organizationNameRuleError(organizationName)
                : null
            }
            autoFocus
            autoComplete="organization"
            maxLength={ORGANIZATION_NAME_MAX_LENGTH}
            labelClassName={AUTH_ONBOARDING_LABEL_CLASS}
            inputClassName={AUTH_COMPACT_INPUT_CLASS}
            className="mt-5"
          />
          <AuthField
            id="logo-url"
            label="Logo URL"
            value={logoUrl}
            onChange={(value) => {
              organizationTouched.touch("logoUrl");
              setLogoUrl(value);
            }}
            onBlur={() => organizationTouched.touch("logoUrl")}
            error={organizationTouched.touched.logoUrl ? logoUrlRuleError(logoUrl) : null}
            autoComplete="off"
            maxLength={LOGO_URL_MAX_LENGTH}
            labelClassName={AUTH_ONBOARDING_LABEL_CLASS}
            inputClassName={AUTH_COMPACT_INPUT_CLASS}
            labelTrailing={
              <span className="ml-2 font-montserrat text-xs font-normal text-[#909090]">
                Optional
              </span>
            }
            className="mt-5"
          />

          <Button
            type="submit"
            size="xl"
            loading={registerMutation.isPending}
            disabled={Boolean(createOrganizationFormError(organizationName, logoUrl))}
            className="mt-7.5 w-full"
          >
            Create Organization
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell panelTop={<AuthBetaBanner />}>
      <h1 className="text-center font-montserrat text-xl font-semibold text-black">
        Create account
      </h1>
      <form onSubmit={submitSignUp} className={AUTH_FORM_CLASS}>
        <AuthField
          id="name"
          label="Your name"
          value={name}
          onChange={(value) => {
            signUpTouched.touch("name");
            setName(value);
          }}
          onBlur={() => signUpTouched.touch("name")}
          error={signUpTouched.touched.name ? nameRuleError(name) : null}
          placeholder="Name"
          autoFocus
          autoComplete="name"
          maxLength={NAME_MAX_LENGTH}
        />
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
          autoComplete="email"
          maxLength={EMAIL_MAX_LENGTH}
          className="mt-5"
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
          placeholder={`${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters`}
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          className="mt-5"
        />
        <AuthPasswordField
          id="confirm-password"
          label="Confirm Password"
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
          placeholder="Keep the same with the password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          className="mt-5"
        />
        <AuthField
          id="invite-code"
          label="Invite code"
          value={inviteCode}
          onChange={(value) => {
            signUpTouched.touch("inviteCode");
            setInviteCode(value);
          }}
          onBlur={() => signUpTouched.touch("inviteCode")}
          error={signUpTouched.touched.inviteCode ? inviteCodeRuleError(inviteCode) : null}
          placeholder="Invite code"
          autoComplete="off"
          maxLength={INVITE_CODE_MAX_LENGTH}
          className="mt-5"
        />

        <Button
          type="submit"
          size="lg"
          disabled={Boolean(registerFormError(name, email, password, confirmPassword, inviteCode))}
          className="mt-7.5 w-full"
        >
          Continue
        </Button>

        <p className={`block ${AUTH_LINK_CLASS}`}>
          Already have an account?{" "}
          <Link
            to={loginPathWithReturnTo(returnTo)}
            className={`inline-flex items-center ${AUTH_LINK_ACCENT_CLASS}`}
          >
            Sign in
            <Icon2Right className="ml-1 text-[#606060]" />
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
