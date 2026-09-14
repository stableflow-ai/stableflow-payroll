import { useMutation, useQuery } from "@tanstack/react-query";
import { getOrganizationInfo } from "@/api/organization";
import { googleRegisterUser, registerUser } from "@/api/auth";
import { queryKeys } from "@/api/query-keys";
import { useAuthStore } from "@/stores/auth";
import type { GoogleRegisterUserBody, RegisterUserBody } from "@/types/auth";

export function useInvitePreviewQuery(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.organization.info(orgId ?? ""),
    queryFn: () => getOrganizationInfo(orgId ?? ""),
    enabled: Boolean(orgId),
  });
}

export function useInviteRegisterMutation() {
  const applySession = useAuthStore((state) => state.applySession);

  return useMutation({
    mutationFn: (body: RegisterUserBody) => registerUser(body),
    onSuccess: (session) => {
      applySession(session.token, session.user);
    },
  });
}

export function useGoogleInviteRegisterMutation() {
  const applySession = useAuthStore((state) => state.applySession);

  return useMutation({
    mutationFn: (body: GoogleRegisterUserBody) => googleRegisterUser(body),
    onSuccess: (session) => {
      applySession(session.token, session.user);
    },
  });
}
