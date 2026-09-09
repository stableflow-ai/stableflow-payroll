/**
 * Auth mutations and profile query.
 *   POST /v1/payroll/auth/login
 *   POST /v1/payroll/auth/register
 *   POST /v1/payroll/change-password
 *   POST /v1/payroll/reset-password
 *   POST /v1/payroll/reset-password/code
 *   GET  /v1/payroll/profile
 *   POST /v1/payroll/profile
 *   POST /v1/payroll/profile/user
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
  updateMemberProfile,
  updateProfile,
} from "@/api/auth";
import { queryKeys } from "@/api/query-keys";
import { ApiError } from "@/lib/api-error";
import { useAuthStore } from "@/stores/auth";
import type { AuthTeamMember, AuthUser } from "@/types/auth";

function teamMemberKey(member: AuthTeamMember | undefined): string {
  if (!member) return "";
  return [
    member.name,
    member.position,
    member.email,
    member.telegram,
    member.slack,
    member.wallets.evm,
    member.wallets.solana,
    member.wallets.near,
    member.wallets.tron,
  ].join("\0");
}

function isSameUser(left: AuthUser, right: AuthUser): boolean {
  return (
    left.id === right.id &&
    left.email === right.email &&
    left.name === right.name &&
    left.role === right.role &&
    (left.telegram ?? "") === (right.telegram ?? "") &&
    (left.slack ?? "") === (right.slack ?? "") &&
    teamMemberKey(left.teamMember) === teamMemberKey(right.teamMember) &&
    (left.organization?.id ?? 0) === (right.organization?.id ?? 0) &&
    (left.organization?.name ?? "") === (right.organization?.name ?? "") &&
    (left.organization?.logo ?? "") === (right.organization?.logo ?? "") &&
    (left.organization?.orgId ?? "") === (right.organization?.orgId ?? "")
  );
}

export function mergeProfileUser(profile: AuthUser, local: AuthUser | null): AuthUser {
  const profileOrg = profile.organization;
  const localOrg = local?.organization;
  if (!profileOrg || !localOrg || profileOrg.id !== localOrg.id) return profile;
  const logo = localOrg.logo || profileOrg.logo;
  const orgId = localOrg.orgId || profileOrg.orgId;
  if (!logo && !orgId) return profile;
  if ((profileOrg.logo ?? "") === (logo ?? "") && (profileOrg.orgId ?? "") === (orgId ?? "")) {
    return profile;
  }
  return {
    ...profile,
    organization: {
      ...profileOrg,
      ...(logo ? { logo } : {}),
      ...(orgId ? { orgId } : {}),
    },
  };
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

export function useUpdateMemberProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMemberProfile,
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
    enabled: Boolean(token) && !token?.startsWith("mock:"),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 1;
    },
  });

  useEffect(() => {
    if (!token || !query.data) return;
    const nextUser = mergeProfileUser(query.data, user);
    if (user && isSameUser(user, nextUser)) return;
    applySession(token, nextUser);
  }, [applySession, query.data, token, user]);

  return query;
}
