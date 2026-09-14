import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { hasGoogleAuthPending, useGoogleAuthPendingStore } from "@/stores/google-auth-pending";

export function useGoogleAuthPendingOrRedirect(fallbackPath: string) {
  const navigate = useNavigate();
  const pending = useGoogleAuthPendingStore();
  const [hydrated, setHydrated] = useState(() => useGoogleAuthPendingStore.persist.hasHydrated());

  useEffect(() => {
    const unsub = useGoogleAuthPendingStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    if (useGoogleAuthPendingStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!hasGoogleAuthPending(pending)) {
      navigate(fallbackPath, { replace: true });
    }
  }, [fallbackPath, hydrated, navigate, pending]);

  return { pending, hydrated, ready: hydrated && hasGoogleAuthPending(pending) };
}
