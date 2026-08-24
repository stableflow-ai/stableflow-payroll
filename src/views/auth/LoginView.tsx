import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  AUTH_CARD_CLASS,
} from "./auth-shared";
import {
  AUTH_LINK_ACCENT_CLASS,
  AUTH_LINK_CLASS,
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  RESET_PASSWORD_VARIANT,
  loginFormError,
} from "./config";

export function LoginView() {
  const navigate = useNavigate();
  const toast = useToast();
  const loginMutation = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const ruleError = loginFormError(email, password);
    if (ruleError) {
      toast.fail({ title: ruleError });
      return;
    }
    try {
      await loginMutation.mutateAsync({ email: email.trim(), password });
      navigate("/", { replace: true });
    } catch (cause) {
      toast.fail({
        title: authErrorMessage(cause, "Unable to sign in"),
      });
    }
  };

  return (
    <AuthShell panelTop={<AuthBetaBanner />}>
      <form onSubmit={submit} className={AUTH_CARD_CLASS}>
        <h1 className="text-center font-montserrat text-xl font-semibold text-black">
          Welcome to Stableflow Pay
        </h1>

        <AuthField
          id="email"
          label="Sign in by Email"
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
          autoComplete="current-password"
          maxLength={PASSWORD_MAX_LENGTH}
        />

        <Button
          type="submit"
          size="lg"
          loading={loginMutation.isPending}
          className="mt-6 w-full"
        >
          Sign in
        </Button>

        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="mt-5 inline-flex w-full items-center justify-center font-montserrat text-sm font-medium text-[#3f8afb] hover:text-[#3f8afb]/90"
        >
          Forgot Password?
          <Icon2Right className="ml-1" />
        </button>

        <p className={`block ${AUTH_LINK_CLASS}`}>
          New to Stableflow Pay?{" "}
          <Link to="/register" className={`inline-flex items-center ${AUTH_LINK_ACCENT_CLASS}`}>
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
