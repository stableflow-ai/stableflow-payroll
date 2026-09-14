import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button/Button";
import { Icon2Right } from "@/components/icons/to-right";
import { useGoogleBindMutation, useSendGoogleBindCodeMutation } from "@/hooks/use-auth-api";
import useToast from "@/hooks/use-toast";
import { useGoogleAuthPendingStore } from "@/stores/google-auth-pending";
import { AuthShell } from "./AuthShell";
import {
  AuthField,
  authErrorMessage,
  AUTH_FORM_CLASS,
  useTouchedFields,
} from "./auth-shared";
import {
  AUTH_LINK_ACCENT_CLASS,
  AUTH_LINK_CLASS,
  CODE_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  SEND_CODE_COOLDOWN_SECONDS,
  SEND_CODE_TEXT_CLASS,
  codeRuleError,
  emailRuleError,
  googleBindFormError,
} from "./config";
import { postAuthPath } from "./return-to";
import { useGoogleAuthPendingOrRedirect } from "./use-google-auth-pending";

const BIND_FIELDS = ["email", "code"] as const;

export function GoogleBindView() {
  const navigate = useNavigate();
  const toast = useToast();
  const clearPending = useGoogleAuthPendingStore((state) => state.clear);
  const orgId = useGoogleAuthPendingStore((state) => state.orgId);
  const fallback = orgId ? `/invite/${encodeURIComponent(orgId)}` : "/login";
  const { pending, ready } = useGoogleAuthPendingOrRedirect(fallback);
  const bindMutation = useGoogleBindMutation();
  const sendCodeMutation = useSendGoogleBindCodeMutation();
  const { touched, touch, touchAll } = useTouchedFields();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [cooldownLeft, setCooldownLeft] = useState(0);

  useEffect(() => {
    if (!pending.email) return;
    setEmail((current) => current || pending.email);
  }, [pending.email]);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownLeft]);

  const sendCode = async () => {
    const ruleError = emailRuleError(email);
    if (ruleError) {
      touch("email");
      return;
    }
    try {
      await sendCodeMutation.mutateAsync({ email: email.trim() });
      setCooldownLeft(SEND_CODE_COOLDOWN_SECONDS);
      toast.success({ title: "Verification code sent" });
    } catch (cause) {
      toast.fail({
        title: authErrorMessage(cause, "Unable to send verification code"),
      });
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    touchAll(BIND_FIELDS);
    if (googleBindFormError(email, code) || !pending.idToken) return;
    try {
      const session = await bindMutation.mutateAsync({
        idToken: pending.idToken,
        email: email.trim(),
        code: code.trim(),
      });
      clearPending();
      navigate(postAuthPath(session.user, pending.returnTo), { replace: true });
    } catch (cause) {
      toast.fail({
        title: authErrorMessage(cause, "Unable to bind Google account"),
      });
    }
  };

  if (!ready) {
    return (
      <AuthShell>
        <p className="text-center font-montserrat text-sm text-[#909090]">Loading…</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <form onSubmit={(event) => void submit(event)} className={AUTH_FORM_CLASS}>
        <h1 className="text-center font-montserrat text-xl font-semibold text-black">
          Bind Google account
        </h1>
        <p className="mt-2.5 text-center font-montserrat text-sm font-normal text-[#606060]">
          Enter the email for your existing account and the verification code we send.
        </p>

        <AuthField
          id="bind-email"
          label="Email"
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
        <AuthField
          id="bind-code"
          label="Verify Code"
          value={code}
          onChange={(value) => {
            touch("code");
            setCode(value);
          }}
          onBlur={() => touch("code")}
          error={touched.code ? codeRuleError(code) : null}
          placeholder="Code"
          autoComplete="one-time-code"
          maxLength={CODE_MAX_LENGTH}
          trailing={
            <button
              type="button"
              disabled={cooldownLeft > 0 || sendCodeMutation.isPending}
              onClick={() => {
                void sendCode();
              }}
              className={SEND_CODE_TEXT_CLASS}
            >
              {cooldownLeft > 0 ? `${cooldownLeft}s` : "Send Code"}
            </button>
          }
        />

        <Button
          type="submit"
          size="lg"
          loading={bindMutation.isPending}
          disabled={Boolean(googleBindFormError(email, code))}
          className="mt-6 w-full"
        >
          Continue
        </Button>

        <p className={`block ${AUTH_LINK_CLASS}`}>
          <Link to={fallback} className={`inline-flex items-center ${AUTH_LINK_ACCENT_CLASS}`}>
            <Icon2Right className="mr-1 rotate-180" />
            Back
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
