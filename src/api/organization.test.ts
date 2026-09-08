import { describe, expect, it } from "vitest";
import {
  mapOrganizationHighPriorityItems,
  mapOrganizationList,
  mapOrganizationOverview,
  mapOrganizationPayoutPoints,
  mapOrganizationPublicInfo,
  addressSettingsRequestBody,
  channelConfigFromStatus,
  integrationSettingsFromOrganization,
  mapOrganizationFieldStatus,
  mapSlackConnect,
  mapSlackOAuth,
  notificationSettingsRequestBody,
  organizationSettingsFromIntegration,
  pickOrganization,
  statusFromChannelConfig,
  updateOrganizationRequestBody,
} from "./organization";
import {
  FIELD_REQUIREMENT,
  ORGANIZATION_FIELD_STATUS,
  ORGANIZATION_HIGH_PRIORITY_CATEGORY,
  defaultAddressSettings,
  defaultNotificationSettings,
} from "@/types/organization";

describe("mapOrganizationOverview", () => {
  it("maps snake_case totals", () => {
    expect(
      mapOrganizationOverview({
        team_members: 8,
        total_payments: 146,
        total_payout: "36520.50",
      }),
    ).toEqual({
      teamMembers: 8,
      totalPayments: 146,
      totalPayout: "36520.50",
    });
  });
});

describe("mapOrganizationPayoutPoints", () => {
  it("maps time to a period label and numeric volume", () => {
    expect(
      mapOrganizationPayoutPoints(
        [
          { time: "2026-08-10T00:00:00+08:00", total_payout: "42000", total_payments: 8 },
          { time: "  ", total_payout: "1", total_payments: 1 },
        ],
        "day",
      ),
    ).toEqual([{ label: "Aug 10", volume: 42000, transaction: 8 }]);
  });

  it("formats monthly buckets as the month name", () => {
    expect(
      mapOrganizationPayoutPoints(
        [{ time: "2026-08-01T00:00:00+08:00", total_payout: "1", total_payments: 2 }],
        "month",
      ),
    ).toEqual([{ label: "Aug", volume: 1, transaction: 2 }]);
  });
});

describe("mapOrganizationHighPriorityItems", () => {
  it("keeps known categories and drops unknown ones", () => {
    expect(
      mapOrganizationHighPriorityItems([
        { category: "payroll", title: "September payroll", description: "3 items" },
        { category: "payFailed", title: "Transaction Failed", description: "August · 2 failed" },
        { category: "requests", title: "2 Payment Requests", description: "September" },
        { category: "other", title: "Other", description: "May" },
      ]),
    ).toEqual([
      {
        category: ORGANIZATION_HIGH_PRIORITY_CATEGORY.Payroll,
        title: "September payroll",
        description: "3 items",
      },
      {
        category: ORGANIZATION_HIGH_PRIORITY_CATEGORY.PayFailed,
        title: "Transaction Failed",
        description: "August · 2 failed",
      },
      {
        category: ORGANIZATION_HIGH_PRIORITY_CATEGORY.PaymentRequest,
        title: "2 Payment Requests",
        description: "September",
      },
    ]);
  });
});

describe("pickOrganization", () => {
  it("prefers the matching id and otherwise uses the first row", () => {
    const items = mapOrganizationList([
      { id: 2, name: "Beta", org_id: "b", role: "admin" },
      { id: 9, name: "Eureka Labs", logo: "https://cdn.example/logo.png", org_id: "e", role: "admin" },
    ]);
    expect(pickOrganization(items, 9)?.name).toBe("Eureka Labs");
    expect(pickOrganization(items, 1)?.id).toBe(2);
    expect(pickOrganization([], 9)).toBeNull();
  });
});

describe("organization field settings", () => {
  it("maps known statuses and treats blank values as disabled", () => {
    expect(mapOrganizationFieldStatus("required")).toBe(ORGANIZATION_FIELD_STATUS.Required);
    expect(mapOrganizationFieldStatus("optional")).toBe(ORGANIZATION_FIELD_STATUS.Optional);
    expect(mapOrganizationFieldStatus("disabled")).toBe(ORGANIZATION_FIELD_STATUS.Disabled);
    expect(mapOrganizationFieldStatus("")).toBe(ORGANIZATION_FIELD_STATUS.Disabled);
    expect(mapOrganizationFieldStatus("unknown")).toBe(ORGANIZATION_FIELD_STATUS.Disabled);
  });

  it("round-trips channel config and keeps EVM from the saved status", () => {
    expect(channelConfigFromStatus(ORGANIZATION_FIELD_STATUS.Required)).toEqual({
      enabled: true,
      requirement: FIELD_REQUIREMENT.Required,
    });
    expect(statusFromChannelConfig({ enabled: false, requirement: FIELD_REQUIREMENT.Required })).toBe(
      ORGANIZATION_FIELD_STATUS.Disabled,
    );
    const integration = integrationSettingsFromOrganization({
      addressSettings: {
        evmAddress: ORGANIZATION_FIELD_STATUS.Required,
        nearAddress: ORGANIZATION_FIELD_STATUS.Optional,
        solanaAddress: ORGANIZATION_FIELD_STATUS.Disabled,
        tronAddress: ORGANIZATION_FIELD_STATUS.Disabled,
      },
      notificationSettings: {
        email: ORGANIZATION_FIELD_STATUS.Required,
        telegram: ORGANIZATION_FIELD_STATUS.Disabled,
        slack: ORGANIZATION_FIELD_STATUS.Optional,
      },
    });
    expect(integration.near).toEqual({ enabled: true, requirement: FIELD_REQUIREMENT.Optional });
    expect(
      organizationSettingsFromIntegration(integration, ORGANIZATION_FIELD_STATUS.Required)
        .addressSettings.evmAddress,
    ).toBe(ORGANIZATION_FIELD_STATUS.Required);
  });

  it("maps public org info used by invite register", () => {
    expect(
      mapOrganizationPublicInfo({
        name: "JimmyGu LLC",
        logo: "https://cdn.example/logo.png",
        address_settings: {
          evm_address: "required",
          near_address: "disabled",
          solana_address: "disabled",
          tron_address: "disabled",
        },
        notification_settings: {
          email: "required",
          telegram: "disabled",
          slack: "disabled",
        },
      }),
    ).toEqual({
      name: "JimmyGu LLC",
      logo: "https://cdn.example/logo.png",
      addressSettings: defaultAddressSettings(),
      notificationSettings: defaultNotificationSettings(),
    });
  });
});

describe("organization settings request bodies", () => {
  it("posts name and optional logo without settings", () => {
    expect(updateOrganizationRequestBody({ name: "Eureka Labs" })).toEqual({
      name: "Eureka Labs",
    });
    expect(
      updateOrganizationRequestBody({
        name: "Eureka Labs",
        logo: "https://cdn.example/logo.png",
      }),
    ).toEqual({
      name: "Eureka Labs",
      logo: "https://cdn.example/logo.png",
    });
  });

  it("sends only the address or notification fields that were set", () => {
    expect(
      addressSettingsRequestBody({
        solanaAddress: ORGANIZATION_FIELD_STATUS.Required,
      }),
    ).toEqual({ solana_address: "required" });
    expect(
      notificationSettingsRequestBody({
        slack: ORGANIZATION_FIELD_STATUS.Disabled,
      }),
    ).toEqual({ slack: "disabled" });
  });
});

describe("slack oauth mappers", () => {
  it("maps the authorization url and throws when it is missing", () => {
    expect(mapSlackConnect({ authorization_url: "https://slack.com/oauth" })).toEqual({
      authorizationUrl: "https://slack.com/oauth",
    });
    expect(() => mapSlackConnect({})).toThrow(/Slack authorization URL is missing/);
  });

  it("maps slack team fields", () => {
    expect(
      mapSlackOAuth({
        slack_team_id: "T1",
        slack_team_name: "Eureka",
      }),
    ).toEqual({
      slackTeamId: "T1",
      slackTeamName: "Eureka",
    });
  });
});
