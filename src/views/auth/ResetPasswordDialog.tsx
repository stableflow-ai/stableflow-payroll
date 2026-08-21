import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { Icon2Right } from "@/components/icons/to-right";
import useToast from "@/hooks/use-toast";
import { AuthField, AuthPasswordField } from "./auth-shared";
import {
  PASSWORD_MAX_LENGTH,
  RESET_PASSWORD_DIALOG_CARD_CLASS,
  RESET_PASSWORD_VARIANT,
  SEND_CODE_COOLDOWN_SECONDS,
  SEND_CODE_TEXT_CLASS,
  authedResetFormError,
  emailRuleError,
  guestResetFormError,
  type ResetPasswordVariant,
} from "./config";

export function ResetPasswordDialog({
  open,
  onClose,
  variant,
}: {
  open: boolean;
  onClose: () => void;
  variant: ResetPasswordVariant;
}) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cooldownLeft, setCooldownLeft] = useState(0);

  useEffect(() => {
    if (open) return;
    setEmail("");
    setCode("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setCooldownLeft(0);
  }, [open]);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownLeft]);

  const sendCode = () => {
    const ruleError = emailRuleError(email);
    if (ruleError) {
      toast.fail({ title: ruleError });
      return;
    }
    // TODO(api): send a verification code to the email when the backend contract is ready.
    setCooldownLeft(SEND_CODE_COOLDOWN_SECONDS);
  };

  const submitGuest = (event: FormEvent) => {
    event.preventDefault();
    const ruleError = guestResetFormError(email, code, newPassword, confirmPassword);
    if (ruleError) {
      toast.fail({ title: ruleError });
      return;
    }
    // TODO(api): verify the code and set the new password when the backend contract is ready.
    onClose();
  };

  const submitAuthed = (event: FormEvent) => {
    event.preventDefault();
    const ruleError = authedResetFormError(currentPassword, newPassword, confirmPassword);
    if (ruleError) {
      toast.fail({ title: ruleError });
      return;
    }
    // TODO(api): change the password when the backend contract is ready.
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Reset password"
      titleClassName="w-full text-center"
      closeClassName="hidden"
      cardClassName={RESET_PASSWORD_DIALOG_CARD_CLASS}
    >
      {variant === RESET_PASSWORD_VARIANT.Guest ? (
        <form onSubmit={submitGuest}>
          <p className="font-montserrat text-sm font-medium text-[#909090]">
            Enter your email and verification code, then set a new password.
          </p>
          <AuthField
            id="reset-email"
            label="Signed Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@company.com"
            autoComplete="email"
            autoFocus
          />
          <AuthField
            id="reset-code"
            label="Verify Code"
            value={code}
            onChange={setCode}
            placeholder="Code"
            autoComplete="one-time-code"
            trailing={
              <button
                type="button"
                disabled={cooldownLeft > 0}
                onClick={sendCode}
                className={SEND_CODE_TEXT_CLASS}
              >
                {cooldownLeft > 0 ? `${cooldownLeft}s` : "Send Code"}
              </button>
            }
          />
          <AuthPasswordField
            id="reset-guest-new-password"
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            maxLength={PASSWORD_MAX_LENGTH}
          />
          <AuthPasswordField
            id="reset-guest-confirm-password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Keep the same with the new password"
            autoComplete="new-password"
            maxLength={PASSWORD_MAX_LENGTH}
          />
          <Button type="submit" size="lg" className="mt-6 w-full">
            Continue
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 flex w-full items-center justify-center gap-2 font-montserrat text-sm font-medium text-[#909090]"
          >
            <Icon2Right className="rotate-180" />
            Back to login
          </button>
        </form>
      ) : (
        <form onSubmit={submitAuthed}>
          <p className="font-montserrat text-sm font-medium text-[#909090]">
            Enter your current password and create a new password below.
          </p>
          <AuthPasswordField
            id="reset-current-password"
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="At least 8 characters"
            autoComplete="current-password"
            maxLength={PASSWORD_MAX_LENGTH}
          />
          <AuthPasswordField
            id="reset-new-password"
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            maxLength={PASSWORD_MAX_LENGTH}
          />
          <AuthPasswordField
            id="reset-confirm-password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Keep the same with the new password"
            autoComplete="new-password"
            maxLength={PASSWORD_MAX_LENGTH}
          />
          <Button type="submit" size="lg" className="mt-6 w-full">
            Continue
          </Button>
        </form>
      )}
    </Dialog>
  );
}
