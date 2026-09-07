import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTeamMember,
  deleteTeamMember,
  getTeamMembers,
  updateTeamMember,
} from "@/api/team";
import { queryKeys } from "@/api/query-keys";
import { organizationId } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import { TEAM_BOOK_PAGE_SIZE, type TeamMemberWrite } from "@/types/team";

export type { TeamMember, TeamMemberWallets, TeamMemberWrite } from "@/types/team";

export function useTeamMembersQuery(options?: {
  page?: number;
  pageSize?: number;
  q?: string;
  enabled?: boolean;
}) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const q = options?.q?.trim() || undefined;
  const extraEnabled = options?.enabled ?? true;
  return useQuery({
    queryKey: queryKeys.team.members({ orgId, page, pageSize, q }),
    queryFn: () =>
      getTeamMembers({
        organizationId: orgId!,
        page,
        pageSize,
        q,
      }),
    enabled: Boolean(token) && orgId !== null && extraEnabled,
    placeholderData: keepPreviousData,
  });
}

export function useTeamMembersInfiniteQuery(enabled = true) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  return useInfiniteQuery({
    queryKey: queryKeys.team.book(orgId ?? -1),
    queryFn: ({ pageParam }) =>
      getTeamMembers({
        organizationId: orgId!,
        page: pageParam,
        pageSize: TEAM_BOOK_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.totalPage <= 0 || lastPage.list.length === 0) return undefined;
      const next = pages.length + 1;
      return next > lastPage.totalPage ? undefined : next;
    },
    enabled: Boolean(token) && orgId !== null && enabled,
  });
}

export function useTeamMemberMutations() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.team.all });

  const createMutation = useMutation({
    mutationFn: async (body: TeamMemberWrite) => {
      const orgId = organizationId(user);
      if (orgId === null) {
        throw new Error("Organization is missing");
      }
      return createTeamMember(orgId, body);
    },
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: (input: { id: number; body: TeamMemberWrite }) =>
      updateTeamMember(input.id, input.body),
    onSuccess: invalidate,
  });
  const removeMutation = useMutation({
    mutationFn: (id: number) => deleteTeamMember(id),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, removeMutation };
}
