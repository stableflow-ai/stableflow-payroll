import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@stableflow/pay-ui/button";
import { IconGoogle } from "@stableflow/pay-ui/icons/google";
import { useGoogleLoginMutation } from "@/hooks/use-auth-api";
import useToast from "@/hooks/use-toast";
import { isGoogleSignInConfigured } from "@/lib/google/config";
import {
  ensureGoogleIdClient,
  renderGoogleIdButton,
  setGoogleIdCredentialListener,
  type GoogleIdTokenProfile,
} from "@/lib/google/id-token";
import { cn } from "@/lib/utils";
import { useGoogleAuthPendingStore } from "@/stores/google-auth-pending";
import {
  authErrorMessage,
  isGoogleUnregisteredError,
} from "../auth-shared";
import {
  GOOGLE_INVITE_REGISTER_PATH,
  GOOGLE_REGISTER_PATH,
} from "../config";
import { postAuthPath } from "../return-to";

export function GoogleSignInSection(props: {
  orAlign?: "start" | "center";
  orgId?: string;
  returnTo?: string | null;
}) {
  const { orAlign = "start", orgId, returnTo = null } = props;
  const navigate = useNavigate();
  const toast = useToast();
  const loginMutation = useGoogleLoginMutation();
  const setPending = useGoogleAuthPendingStore((state) => state.setPending);
  const hostRef = useRef<HTMLDivElement>(null);
  const handlingRef = useRef(false);
  const configured = isGoogleSignInConfigured();

  const handleProfile = async (profile: GoogleIdTokenProfile) => {
    if (handlingRef.current) return;
    handlingRef.current = true;
    try {
      const session = await loginMutation.mutateAsync({ idToken: profile.idToken });
      navigate(postAuthPath(session.user, orgId ? null : returnTo), { replace: true });
    } catch (cause) {
      if (isGoogleUnregisteredError(cause)) {
        setPending({
          idToken: profile.idToken,
          name: profile.name,
          email: profile.email,
          orgId: orgId ?? "",
          returnTo,
        });
        navigate(orgId ? GOOGLE_INVITE_REGISTER_PATH(orgId) : GOOGLE_REGISTER_PATH, {
          replace: true,
        });
        return;
      }
      toast.fail({
        title: authErrorMessage(cause, "Unable to sign in with Google"),
      });
    } finally {
      handlingRef.current = false;
    }
  };

  const handleProfileRef = useRef(handleProfile);
  handleProfileRef.current = handleProfile;
  const toastRef = useRef(toast);
  toastRef.current = toast;

  useEffect(() => {
    if (!configured) return;
    setGoogleIdCredentialListener((profile) => {
      void handleProfileRef.current(profile);
    });
    void ensureGoogleIdClient()
      .then(() => {
        const host = hostRef.current;
        if (!host) return;
        renderGoogleIdButton(host, host.offsetWidth || 400);
      })
      .catch((cause) => {
        toastRef.current.fail({
          title: authErrorMessage(cause, "Unable to load Google sign-in"),
        });
      });
    return () => {
      setGoogleIdCredentialListener(null);
    };
  }, [configured]);

  if (!configured) return null;

  return (
    <>
      <div className="mt-8.5 h-px w-full bg-[#E3E3E3]" />
      <p
        className={cn(
          "mt-7.5 font-montserrat text-sm font-medium text-[#909090]",
          orAlign === "center" && "text-center",
        )}
      >
        Or
      </p>
      <div className="relative mt-3 h-[50px] w-full">
        <Button
          type="button"
          size="lg"
          variant="normal"
          tabIndex={-1}
          loading={loginMutation.isPending}
          className="pointer-events-none h-[50px] w-full border-transparent bg-white text-black shadow-[0_0_6px_0_rgba(0,0,0,0.06)]"
        >
          <IconGoogle className="shrink-0" />
          Sign in with Google
        </Button>
        <div
          ref={hostRef}
          aria-label="Sign in with Google"
          className={cn(
            "absolute inset-0 overflow-hidden opacity-0 [&>div]:h-full [&>div]:w-full [&_iframe]:h-full [&_iframe]:w-full",
            loginMutation.isPending && "pointer-events-none",
          )}
        />
      </div>
      <div className="mt-7.5 h-px w-full bg-[#E3E3E3]" />
    </>
  );
}
