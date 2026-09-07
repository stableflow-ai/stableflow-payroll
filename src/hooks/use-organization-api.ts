import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrganization, pickOrganization, updateOrganization } from "@/api/organization";
import { queryKeys } from "@/api/query-keys";
import { organizationId } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import type { UpdateOrganizationBody } from "@/types/organization";

export function useOrganizationQuery() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  return useQuery({
    queryKey: queryKeys.organization.detail(orgId ?? -1),
    queryFn: async () => {
      const items = await getOrganization(orgId!);
      return pickOrganization(items, orgId!);
    },
    enabled: Boolean(token) && orgId !== null,
  });
}

export function useUpdateOrganizationMutation() {
  const queryClient = useQueryClient();
  const applySession = useAuthStore((state) => state.applySession);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (body: UpdateOrganizationBody) => {
      const orgId = organizationId(user);
      if (orgId === null) {
        throw new Error("Organization is missing");
      }
      await updateOrganization(orgId, body);
      return { id: orgId, name: body.name, logo: body.logo };
    },
    onSuccess: (organization) => {
      if (token && user) {
        const logo = organization.logo?.trim();
        applySession(token, {
          ...user,
          organization: {
            id: organization.id,
            name: organization.name,
            ...(logo ? { logo } : {}),
          },
        });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.organization.all });
    },
  });
}
