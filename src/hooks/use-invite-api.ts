/**
 * TODO(api): mock data until the invite contract exists.
 * Replace with:
 *   1. types in src/types/<domain>.ts
 *   2. a function in src/api/<domain>.ts
 *   3. a key in src/api/query-keys.ts
 *   4. queryFn -> the real api function
 *   5. delete src/mocks/invite.ts and its MOCK_ENABLED entry
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import { MOCK_ENABLED } from "@/mocks/config";
import {
  getInvitePreview,
  registerWithInvite,
  type InviteRegisterInput,
} from "@/mocks/invite";
import { useAuthStore } from "@/stores/auth";

const INVITE_PREVIEW_KEY = ["invite-preview"] as const;

export function useInvitePreviewQuery(orgId: string | undefined) {
  return useQuery({
    queryKey: [...INVITE_PREVIEW_KEY, orgId ?? ""] as const,
    queryFn: () => getInvitePreview(orgId ?? ""),
    enabled: Boolean(orgId) && MOCK_ENABLED.invite,
  });
}

export function useInviteRegisterMutation() {
  const applySession = useAuthStore((state) => state.applySession);

  return useMutation({
    mutationFn: async (body: InviteRegisterInput) => {
      if (!MOCK_ENABLED.invite) {
        throw new Error("Invite registration is not available");
      }
      return registerWithInvite(body);
    },
    onSuccess: (session) => {
      applySession(session.token, session.user);
    },
  });
}
