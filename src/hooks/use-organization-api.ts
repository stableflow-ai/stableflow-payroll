import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrganization, pickOrganization, updateOrganization } from "@/api/organization";
import { queryKeys } from "@/api/query-keys";
import { organizationId } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import type { AuthOrganization, AuthUser } from "@/types/auth";
import type { OrganizationItem, UpdateOrganizationBody } from "@/types/organization";

function sessionOrganization(
  current: AuthOrganization | null | undefined,
  patch: { id: number; name: string; logo?: string; orgId?: string },
): AuthOrganization {
  const logo = patch.logo?.trim() || current?.logo?.trim() || "";
  const orgId = patch.orgId?.trim() || current?.orgId?.trim() || "";
  return {
    id: patch.id,
    name: patch.name,
    ...(logo ? { logo } : {}),
    ...(orgId ? { orgId } : {}),
  };
}

function shouldPersistOrganization(user: AuthUser | null, item: OrganizationItem): boolean {
  const current = user?.organization;
  if (!current) return false;
  const publicId = item.orgId.trim();
  if (!publicId) return false;
  return (
    current.orgId !== publicId ||
    current.name !== item.name ||
    (current.logo ?? "") !== (item.logo ?? current.logo ?? "")
  );
}

export function useOrganizationQuery() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const applySession = useAuthStore((state) => state.applySession);
  const orgId = organizationId(user);
  const query = useQuery({
    queryKey: queryKeys.organization.detail(orgId ?? -1),
    queryFn: async () => {
      const items = await getOrganization(orgId!);
      return pickOrganization(items, orgId!);
    },
    enabled: Boolean(token) && orgId !== null,
  });

  useEffect(() => {
    if (!token || !user || !query.data) return;
    if (!shouldPersistOrganization(user, query.data)) return;
    applySession(token, {
      ...user,
      organization: sessionOrganization(user.organization, {
        id: user.organization?.id ?? query.data.id,
        name: query.data.name,
        logo: query.data.logo,
        orgId: query.data.orgId,
      }),
    });
  }, [applySession, query.data, token, user]);

  return query;
}

export function useUpdateOrganizationMutation() {
  const queryClient = useQueryClient();
  const applySession = useAuthStore((state) => state.applySession);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (body: UpdateOrganizationBody) => {
      const numericId = organizationId(user);
      if (numericId === null) {
        throw new Error("Organization is missing");
      }
      await updateOrganization(numericId, body);
      return { id: numericId, name: body.name, logo: body.logo };
    },
    onSuccess: (organization) => {
      if (token && user) {
        applySession(token, {
          ...user,
          organization: sessionOrganization(user.organization, {
            id: organization.id,
            name: organization.name,
            logo: organization.logo,
          }),
        });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.organization.all });
    },
  });
}
