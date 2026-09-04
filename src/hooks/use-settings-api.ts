/**
 * TODO(api): mock data until the settings / integration contract exists.
 * Replace with:
 *   1. types in src/types/<domain>.ts
 *   2. a function in src/api/<domain>.ts
 *   3. a key in src/api/query-keys.ts
 *   4. queryFn -> the real api function
 *   5. delete src/mocks/settings.ts and its MOCK_ENABLED entry
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MOCK_ENABLED } from "@/mocks/config";
import {
  defaultIntegrationSettings,
  getIntegrationSettings,
  updateIntegrationField,
  type ChannelConfig,
  type IntegrationFieldKey,
} from "@/mocks/settings";
import { useAuthStore } from "@/stores/auth";

export type {
  ChannelConfig,
  FieldRequirement,
  IntegrationFieldKey,
  IntegrationSettings,
} from "@/mocks/settings";
export {
  FIELD_REQUIREMENT,
  INTEGRATION_FIELD,
  defaultIntegrationSettings,
} from "@/mocks/settings";

const SETTINGS_KEY = ["settings-integration"] as const;

export function useIntegrationSettingsQuery() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => getIntegrationSettings(),
    enabled: Boolean(token) && MOCK_ENABLED.settings,
    placeholderData: defaultIntegrationSettings(),
  });
}

export function useUpdateIntegrationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { key: IntegrationFieldKey; patch: Partial<ChannelConfig> }) => {
      if (!MOCK_ENABLED.settings) {
        throw new Error("Integration settings are not available");
      }
      return updateIntegrationField(input.key, input.patch);
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(SETTINGS_KEY, settings);
    },
  });
}
