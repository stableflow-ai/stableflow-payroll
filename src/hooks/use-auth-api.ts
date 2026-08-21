/**
 * Auth mutations.
 *   POST /v1/pay/auth/login
 *   POST /v1/pay/auth/register
 *
 * On success the session is written to the Zustand auth store (and localStorage).
 * Views should still `mutateAsync` and then navigate.
 */
import { useMutation } from "@tanstack/react-query";
import { login, register } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";

export function useLoginMutation() {
  const applySession = useAuthStore((state) => state.applySession);
  return useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      applySession(session.token, session.user);
    },
  });
}

export function useRegisterMutation() {
  const applySession = useAuthStore((state) => state.applySession);
  return useMutation({
    mutationFn: register,
    onSuccess: (session) => {
      applySession(session.token, session.user);
    },
  });
}
