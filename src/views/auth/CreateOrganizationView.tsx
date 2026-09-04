import { type FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HEADER_AVATAR_SRC } from "@/components/layout/config";
import { IconLogout } from "@/components/icons";
import { Button } from "@/components/ui/button/Button";
import { useCreateOrganizationMutation } from "@/hooks/use-organization-api";
import useToast from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth";
import { AuthShell } from "./AuthShell";
import {
  AuthField,
  authErrorMessage,
  AUTH_COMPACT_INPUT_CLASS,
} from "./auth-shared";
import {
  AUTH_ONBOARDING_FORM_CLASS,
  AUTH_ONBOARDING_LABEL_CLASS,
  LOGO_URL_MAX_LENGTH,
  ORGANIZATION_NAME_MAX_LENGTH,
  createOrganizationFormError,
} from "./config";
import { returnToFromSearch } from "./return-to";

export function CreateOrganizationView() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = returnToFromSearch(params.toString());
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const createMutation = useCreateOrganizationMutation();

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const ruleError = createOrganizationFormError(name, logoUrl);
    if (ruleError) {
      toast.fail({ title: ruleError });
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        logoUrl: logoUrl.trim() || undefined,
      });
      navigate(returnTo ?? "/", { replace: true });
    } catch (cause) {
      toast.fail({
        title: authErrorMessage(cause, "Unable to create organization"),
      });
    }
  };

  const signOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <AuthShell
      panelHeader={
        <div className="flex items-center gap-1.5">
          <img
            src={HEADER_AVATAR_SRC}
            alt=""
            className="size-5 shrink-0 rounded-full object-cover"
          />
          <span className="max-w-[180px] truncate font-montserrat text-xs font-normal text-[#606060]">
            {user?.email}
          </span>
          <button
            type="button"
            aria-label="Log out"
            onClick={signOut}
            className="ml-0.5 text-[#606060] transition-colors hover:text-danger"
          >
            <IconLogout className="size-3" />
          </button>
        </div>
      }
    >
      <form onSubmit={submit} className={AUTH_ONBOARDING_FORM_CLASS}>
        <h1 className="font-montserrat text-xl font-semibold text-black">
          A few quick questions to get you started
        </h1>
        <p className="mt-2.5 font-montserrat text-sm font-normal text-[#606060]">
          Tell us more about your organization
        </p>

        <AuthField
          id="organization-name"
          label="Organization Name"
          value={name}
          onChange={setName}
          autoFocus
          autoComplete="organization"
          maxLength={ORGANIZATION_NAME_MAX_LENGTH}
          labelClassName={AUTH_ONBOARDING_LABEL_CLASS}
          inputClassName={AUTH_COMPACT_INPUT_CLASS}
        />
        <AuthField
          id="logo-url"
          label="Logo URL"
          value={logoUrl}
          onChange={setLogoUrl}
          autoComplete="off"
          maxLength={LOGO_URL_MAX_LENGTH}
          labelClassName={AUTH_ONBOARDING_LABEL_CLASS}
          inputClassName={AUTH_COMPACT_INPUT_CLASS}
          labelTrailing={
            <span className="ml-2 font-montserrat text-xs font-normal text-[#909090]">
              Optional
            </span>
          }
        />

        <Button
          type="submit"
          size="xl"
          loading={createMutation.isPending}
          className="mt-auto w-full"
        >
          Create Organization
        </Button>
      </form>
    </AuthShell>
  );
}
