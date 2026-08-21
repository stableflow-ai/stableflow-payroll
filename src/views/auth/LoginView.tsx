import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button/Button";
import { useLoginMutation } from "@/hooks/use-auth-api";
import useToast from "@/hooks/use-toast";
import { AuthShell } from "./AuthShell";
import {
  AuthBetaBanner,
  AuthField,
  authErrorMessage,
  AUTH_CARD_CLASS,
} from "./auth-shared";
import {
  AUTH_LINK_ACCENT_CLASS,
  AUTH_LINK_CLASS,
  PASSWORD_MAX_LENGTH,
  loginFormError,
} from "./config";

export function LoginView() {
  const navigate = useNavigate();
  const toast = useToast();
  const loginMutation = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
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

        <p className={`block ${AUTH_LINK_CLASS}`}>
          New to Stableflow Pay?{" "}
          <Link to="/register" className={AUTH_LINK_ACCENT_CLASS}>
            Create an account
          </Link>
          <span aria-hidden className={`ml-1 ${AUTH_LINK_ACCENT_CLASS}`}>
            →
          </span>
        </p>
      </form>
    </AuthShell>
  );
}
