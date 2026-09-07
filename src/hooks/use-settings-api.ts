import { useOrganizationQuery } from "@/hooks/use-organization-api";
import { integrationSettingsFromOrganization } from "@/api/organization";
import {
  FIELD_REQUIREMENT,
  INTEGRATION_FIELD,
  defaultIntegrationSettings,
  type ChannelConfig,
  type FieldRequirement,
  type IntegrationFieldKey,
  type IntegrationSettings,
} from "@/types/organization";

export type {
  ChannelConfig,
  FieldRequirement,
  IntegrationFieldKey,
  IntegrationSettings,
};

export {
  FIELD_REQUIREMENT,
  INTEGRATION_FIELD,
  defaultIntegrationSettings,
};

export function useIntegrationSettingsQuery() {
  const query = useOrganizationQuery();
  return {
    ...query,
    data: query.data ? integrationSettingsFromOrganization(query.data) : undefined,
  };
}
