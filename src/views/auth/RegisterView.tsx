import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button/Button";
import { useRegisterMutation } from "@/hooks/use-auth-api";
import useToast from "@/hooks/use-toast";
import { AuthShell } from "./AuthShell";
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
  INVITE_CODE_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  registerFormError,
} from "./config";
import { loginPathWithReturnTo, returnToFromSearch } from "./return-to";

export function RegisterView() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = returnToFromSearch(params.toString());
  const toast = useToast();
  const registerMutation = useRegisterMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const ruleError = registerFormError(name, email, password, confirmPassword, inviteCode);
    if (ruleError) {
      toast.fail({ title: ruleError });
      return;
    }
    try {
      await registerMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
        inviteCode: inviteCode.trim(),
      });
      navigate(returnTo ?? "/pay", { replace: true });
    } catch (cause) {
      toast.fail({
        title: authErrorMessage(cause, "Unable to create account"),
      });
    }
  };

  return (
    <AuthShell panelTop={<AuthBetaBanner />}>
      <form onSubmit={submit} className={AUTH_CARD_CLASS}>
        <h1 className="text-center font-montserrat text-xl font-semibold text-black">
          Create account
        </h1>

        <AuthField
          id="name"
          label="Your name"
          value={name}
          onChange={setName}
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
          onChange={setEmail}
          placeholder="you@company.com"
          autoComplete="email"
          maxLength={EMAIL_MAX_LENGTH}
        />
        <AuthPasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder={`${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters`}
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
        />
        <AuthPasswordField
          id="confirm-password"
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Keep the same with the password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
        />
        <AuthField
          id="invite-code"
          label="Invite code"
          value={inviteCode}
          onChange={setInviteCode}
          placeholder="Invite code"
          autoComplete="off"
          maxLength={INVITE_CODE_MAX_LENGTH}
        />

        <Button
          type="submit"
          size="lg"
          loading={registerMutation.isPending}
          className="mt-6 w-full"
        >
          Create account
        </Button>

        <p className={`block ${AUTH_LINK_CLASS}`}>
          Already have an account?{" "}
          <Link to={loginPathWithReturnTo(returnTo)} className={AUTH_LINK_ACCENT_CLASS}>
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
