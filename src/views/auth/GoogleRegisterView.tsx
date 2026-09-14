import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button/Button";
import { Icon2Right } from "@/components/icons/to-right";
import { useGoogleRegisterMutation } from "@/hooks/use-auth-api";
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
  INVITE_CODE_MAX_LENGTH,
  LOGO_URL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  ORGANIZATION_NAME_MAX_LENGTH,
  googleAdminRegisterFormError,
  inviteCodeRuleError,
  logoUrlRuleError,
  nameRuleError,
  organizationNameRuleError,
} from "./config";
import { postAuthPath } from "./return-to";
import { useGoogleAuthPendingOrRedirect } from "./use-google-auth-pending";

const REGISTER_FIELDS = ["name", "inviteCode", "organizationName", "logoUrl"] as const;

export function GoogleRegisterView() {
  const navigate = useNavigate();
  const toast = useToast();
  const clearPending = useGoogleAuthPendingStore((state) => state.clear);
  const { pending, ready } = useGoogleAuthPendingOrRedirect("/login");
  const registerMutation = useGoogleRegisterMutation();
  const { touched, touch, touchAll } = useTouchedFields();

  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    if (!pending.name) return;
    setName((current) => current || pending.name);
  }, [pending.name]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    touchAll(REGISTER_FIELDS);
    if (googleAdminRegisterFormError(name, inviteCode, organizationName, logoUrl) || !pending.idToken) {
      return;
    }
    const logo = logoUrl.trim();
    try {
      const session = await registerMutation.mutateAsync({
        idToken: pending.idToken,
        name: name.trim(),
        inviteCode: inviteCode.trim(),
        organization: logo
          ? { name: organizationName.trim(), logo }
          : { name: organizationName.trim() },
      });
      clearPending();
      navigate(postAuthPath(session.user, pending.returnTo), { replace: true });
    } catch (cause) {
      toast.fail({
        title: authErrorMessage(cause, "Unable to create account"),
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
          Create account
        </h1>
        <p className="mt-2.5 text-center font-montserrat text-sm font-normal text-[#606060]">
          Finish registering this Google account as an organization admin.
        </p>

        <AuthField
          id="google-name"
          label="Your name"
          value={name}
          onChange={(value) => {
            touch("name");
            setName(value);
          }}
          onBlur={() => touch("name")}
          error={touched.name ? nameRuleError(name) : null}
          placeholder="Name"
          autoFocus
          autoComplete="name"
          maxLength={NAME_MAX_LENGTH}
        />
        <AuthField
          id="google-invite-code"
          label="Invite code"
          value={inviteCode}
          onChange={(value) => {
            touch("inviteCode");
            setInviteCode(value);
          }}
          onBlur={() => touch("inviteCode")}
          error={touched.inviteCode ? inviteCodeRuleError(inviteCode) : null}
          placeholder="Invite code"
          autoComplete="off"
          maxLength={INVITE_CODE_MAX_LENGTH}
        />
        <AuthField
          id="google-organization-name"
          label="Organization Name"
          value={organizationName}
          onChange={(value) => {
            touch("organizationName");
            setOrganizationName(value);
          }}
          onBlur={() => touch("organizationName")}
          error={touched.organizationName ? organizationNameRuleError(organizationName) : null}
          autoComplete="organization"
          maxLength={ORGANIZATION_NAME_MAX_LENGTH}
        />
        <AuthField
          id="google-logo-url"
          label="Logo URL"
          value={logoUrl}
          onChange={(value) => {
            touch("logoUrl");
            setLogoUrl(value);
          }}
          onBlur={() => touch("logoUrl")}
          error={touched.logoUrl ? logoUrlRuleError(logoUrl) : null}
          autoComplete="off"
          maxLength={LOGO_URL_MAX_LENGTH}
          labelTrailing={
            <span className="ml-2 font-montserrat text-xs font-normal text-[#909090]">
              Optional
            </span>
          }
        />

        <Button
          type="submit"
          size="lg"
          loading={registerMutation.isPending}
          disabled={Boolean(googleAdminRegisterFormError(name, inviteCode, organizationName, logoUrl))}
          className="mt-6 w-full"
        >
          Continue
        </Button>

        <p className={`block ${AUTH_LINK_CLASS}`}>
          <Link to="/login" className={`inline-flex items-center ${AUTH_LINK_ACCENT_CLASS}`}>
            <Icon2Right className="mr-1 rotate-180" />
            Back
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
