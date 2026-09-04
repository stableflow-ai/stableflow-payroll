/**
 * TODO(api): mock data until the organization contract exists.
 * Replace with:
 *   1. types in src/types/<domain>.ts
 *   2. a function in src/api/<domain>.ts
 *   3. a key in src/api/query-keys.ts
 *   4. queryFn -> the real api function
 *   5. delete src/mocks/organization.ts and its MOCK_ENABLED entry
 */
import { useMutation } from "@tanstack/react-query";
import { MOCK_ENABLED } from "@/mocks/config";
import { createOrganization, type CreateOrganizationInput } from "@/mocks/organization";
import { useAuthStore } from "@/stores/auth";

export function useCreateOrganizationMutation() {
  const applySession = useAuthStore((state) => state.applySession);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (body: CreateOrganizationInput) => {
      if (!MOCK_ENABLED.organization) {
        throw new Error("Create organization is not available");
      }
      return createOrganization(body);
    },
    onSuccess: (organization) => {
      if (!token || !user) return;
      applySession(token, {
        ...user,
        organization: { name: organization.name },
      });
    },
  });
}
