/**
 * Client session store (Zustand).
 *
 * Server state belongs in TanStack Query. Keep this store for the JWT session
 * (`token` + `user`) only. Hydrate from localStorage on first import.
 * `GET /v1/pay/profile` (`useProfileQuery`) validates the stored token in the
 * background; HTTP 401 clears the session.
 */
import { create } from "zustand";
import {
  clearStoredSession,
  getStoredSession,
  setOnUnauthorized,
  setStoredSession,
} from "@/lib/auth-session";
import { queryClient } from "@/lib/query-client";
import type { AuthUser } from "@/types/auth";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  applySession: (token: string, user: AuthUser) => void;
  logout: () => void;
}

function readInitialSession(): Pick<AuthState, "token" | "user"> {
  const session = getStoredSession();
  if (!session) return { token: null, user: null };
  return { token: session.token, user: session.user };
}

export const useAuthStore = create<AuthState>((set) => ({
  ...readInitialSession(),
  applySession: (token, user) => {
    setStoredSession(token, user);
    set({ token, user });
  },
  logout: () => {
    clearStoredSession();
    queryClient.clear();
    set({ token: null, user: null });
  },
}));

setOnUnauthorized(() => {
  useAuthStore.getState().logout();
});
