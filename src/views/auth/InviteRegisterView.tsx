import { type FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Icon2Right } from "@/components/icons/to-right";
import { Button } from "@/components/ui/button/Button";
import { useInvitePreviewQuery, useInviteRegisterMutation } from "@/hooks/use-invite-api";
import useToast from "@/hooks/use-toast";
import { AuthShell } from "./AuthShell";
import {
  AuthField,
  AuthPasswordField,
  authErrorMessage,
  AUTH_FORM_CLASS,
} from "./auth-shared";
import {
  AUTH_LINK_ACCENT_CLASS,
  AUTH_LINK_CLASS,
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  inviteRegisterFormError,
} from "./config";

export function InviteRegisterView() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const previewQuery = useInvitePreviewQuery(orgId);
  const registerMutation = useInviteRegisterMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!orgId) {
      toast.fail({ title: "Invite link is missing an organization" });
      return;
    }
    const ruleError = inviteRegisterFormError(name, email, password, confirmPassword);
    if (ruleError) {
      toast.fail({ title: ruleError });
      return;
    }
    try {
      await registerMutation.mutateAsync({
        orgId,
        name: name.trim(),
        email: email.trim(),
        password,
      });
      navigate("/", { replace: true });
    } catch (cause) {
      toast.fail({
        title: authErrorMessage(cause, "Unable to create account"),
      });
    }
  };

  const preview = previewQuery.data;

  return (
    <AuthShell>
      <form onSubmit={submit} className={AUTH_FORM_CLASS}>
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
              id="name"
              label="Name"
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

            <Button
              type="submit"
              size="lg"
              loading={registerMutation.isPending}
              className="mt-6 w-full"
            >
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
