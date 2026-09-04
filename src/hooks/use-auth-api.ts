/**
 * Auth mutations and profile query.
 *   POST /v1/payroll/auth/login
 *   POST /v1/payroll/auth/register
 *   POST /v1/payroll/change-password
 *   POST /v1/payroll/reset-password
 *   POST /v1/payroll/reset-password/code
 *   GET  /v1/payroll/profile
 *   POST /v1/payroll/profile
 *
 * Login / register / profile success writes the session to the Zustand auth
 * store (and localStorage). Views should still `mutateAsync` and then navigate.
 */
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changePassword,
  getProfile,
  login,
  register,
  resetPassword,
  sendResetPasswordCode,
  updateProfile,
} from "@/api/auth";
import { queryKeys } from "@/api/query-keys";
import { ApiError } from "@/lib/api-error";
import { useAuthStore } from "@/stores/auth";
import type { AuthUser } from "@/types/auth";

function isSameUser(left: AuthUser, right: AuthUser): boolean {
  return (
    left.id === right.id &&
    left.email === right.email &&
    left.name === right.name &&
    left.role === right.role
  );
}

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

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: changePassword,
  });
}

export function useSendResetPasswordCodeMutation() {
  return useMutation({
    mutationFn: sendResetPasswordCode,
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: resetPassword,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile });
    },
  });
}

export function useProfileQuery() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const applySession = useAuthStore((state) => state.applySession);

  const query = useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: getProfile,
    enabled: Boolean(token),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 1;
    },
  });

  useEffect(() => {
    if (!token || !query.data) return;
    if (user && isSameUser(user, query.data)) return;
    applySession(token, query.data);
  }, [applySession, query.data, token, user]);

  return query;
}
