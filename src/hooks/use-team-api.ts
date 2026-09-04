/**
 * TODO(api): mock data until the team contract exists.
 * Replace with:
 *   1. types in src/types/<domain>.ts
 *   2. a function in src/api/<domain>.ts
 *   3. a key in src/api/query-keys.ts
 *   4. queryFn -> the real api function
 *   5. delete src/mocks/team.ts and its MOCK_ENABLED entry
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MOCK_ENABLED } from "@/mocks/config";
import {
  createTeamMember,
  listTeamMembers,
  removeTeamMember,
  updateTeamMember,
  type TeamMemberWrite,
} from "@/mocks/team";
import { useAuthStore } from "@/stores/auth";

export type {
  TeamInviteWrite,
  TeamMember,
  TeamMemberWallets,
  TeamMemberWrite,
  TeamSchedule,
} from "@/mocks/team";
export { TEAM_SCHEDULE } from "@/mocks/team";

const TEAM_MEMBERS_KEY = ["team-members"] as const;

export function useTeamMembersQuery() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: TEAM_MEMBERS_KEY,
    queryFn: () => listTeamMembers(),
    enabled: Boolean(token) && MOCK_ENABLED.team,
  });
}

export function useTeamMemberMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: TEAM_MEMBERS_KEY });

  const createMutation = useMutation({
    mutationFn: async (body: TeamMemberWrite) => createTeamMember(body),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: async (input: { id: string; body: TeamMemberWrite }) =>
      updateTeamMember(input.id, input.body),
    onSuccess: invalidate,
  });
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      removeTeamMember(id);
    },
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, removeMutation };
}
