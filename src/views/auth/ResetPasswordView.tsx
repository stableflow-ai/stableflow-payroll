import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button/Button";
import { Icon2Right } from "@/components/icons/to-right";
import useToast from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth";
import { AuthShell } from "./AuthShell";
import {
  AuthBetaBanner,
  AuthPasswordField,
  AUTH_CARD_CLASS,
} from "./auth-shared";
import {
  AUTH_LINK_CLASS,
  PASSWORD_MAX_LENGTH,
  linkResetFormError,
} from "./config";

export function ResetPasswordView() {
  const navigate = useNavigate();
  const toast = useToast();
  const logout = useAuthStore((state) => state.logout);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (token) return;
    toast.fail({ title: "Reset link is invalid" });
    navigate("/login", { replace: true });
  }, [navigate, token]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      toast.fail({ title: "Reset link is invalid" });
      navigate("/login", { replace: true });
      return;
    }
    const ruleError = linkResetFormError(newPassword, confirmPassword);
    if (ruleError) {
      toast.fail({ title: ruleError });
      return;
    }
    // TODO(api): POST token + newPassword via src/api/auth.ts when the backend contract is ready.
    logout();
    navigate("/login", { replace: true });
  };

  if (!token) return null;

  return (
    <AuthShell panelTop={<AuthBetaBanner />}>
      <form onSubmit={submit} className={AUTH_CARD_CLASS}>
        <h1 className="text-center font-montserrat text-xl font-semibold text-black">
          Reset password
        </h1>
        <AuthPasswordField
          id="reset-link-new-password"
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
        />
        <AuthPasswordField
          id="reset-link-confirm-password"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Keep the same with the new password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
        />
        <Button type="submit" size="lg" className="mt-6 w-full">
          Confirm
        </Button>
        <Link
          to="/login"
          className={`${AUTH_LINK_CLASS} flex items-center justify-center gap-2`}
        >
          <Icon2Right className="rotate-180" />
          Back to login
        </Link>
      </form>
    </AuthShell>
  );
}
