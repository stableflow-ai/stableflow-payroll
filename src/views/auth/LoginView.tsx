import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button/Button";
import { Icon2Right } from "@/components/icons/to-right";
import { useLoginMutation } from "@/hooks/use-auth-api";
import useToast from "@/hooks/use-toast";
import { AuthShell } from "./AuthShell";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import {
  AuthBetaBanner,
  AuthField,
  AuthPasswordField,
  authErrorMessage,
  AUTH_FORM_CLASS,
  useTouchedFields,
} from "./auth-shared";
import {
  AUTH_LINK_ACCENT_CLASS,
  AUTH_LINK_CLASS,
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  RESET_PASSWORD_VARIANT,
  emailRuleError,
  loginFormError,
  passwordRuleError,
} from "./config";
import { postAuthPath, registerPathWithReturnTo, returnToFromSearch } from "./return-to";
import { GoogleSignInSection } from "./components/GoogleSignInSection";

const LOGIN_FIELDS = ["email", "password"] as const;

export function LoginView() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = returnToFromSearch(params.toString());
  const toast = useToast();
  const loginMutation = useLoginMutation();
  const { touched, touch, touchAll } = useTouchedFields();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    touchAll(LOGIN_FIELDS);
    if (loginFormError(email, password)) return;
    try {
      const session = await loginMutation.mutateAsync({ email: email.trim(), password });
      navigate(postAuthPath(session.user, returnTo), { replace: true });
    } catch (cause) {
      toast.fail({
        title: authErrorMessage(cause, "Unable to sign in"),
      });
    }
  };

  return (
    <AuthShell panelTop={<AuthBetaBanner />}>
      <form onSubmit={(event) => void submit(event)} className={AUTH_FORM_CLASS}>
        <h1 className="text-center font-montserrat text-xl font-semibold text-black">
          Welcome to Payroll. Stableflow
        </h1>

        <AuthField
          id="email"
          label="Sign in by Email"
          type="email"
          value={email}
          onChange={(value) => {
            touch("email");
            setEmail(value);
          }}
          onBlur={() => touch("email")}
          error={touched.email ? emailRuleError(email) : null}
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
            touch("password");
            setPassword(value);
          }}
          onBlur={() => touch("password")}
          error={touched.password ? passwordRuleError(password) : null}
          placeholder="At least 8 characters"
          autoComplete="current-password"
          maxLength={PASSWORD_MAX_LENGTH}
        />

        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="mt-2.5 inline-flex items-center font-montserrat text-xs font-medium text-[#909090] hover:text-[#606060]"
        >
          Forgot Password?
          <Icon2Right className="ml-1" />
        </button>

        <Button
          type="submit"
          size="lg"
          loading={loginMutation.isPending}
          disabled={Boolean(loginFormError(email, password))}
          className="mt-6 w-full"
        >
          Sign in
        </Button>

        <GoogleSignInSection returnTo={returnTo} />

        <p className={`block ${AUTH_LINK_CLASS}`}>
          New to Pay. Stableflow?{" "}
          <Link
            to={registerPathWithReturnTo(returnTo)}
            className={`inline-flex items-center ${AUTH_LINK_ACCENT_CLASS}`}
          >
            Create an account
            <Icon2Right className="ml-1" />
          </Link>
        </p>
      </form>

      <ResetPasswordDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        variant={RESET_PASSWORD_VARIANT.Guest}
      />
    </AuthShell>
  );
}
