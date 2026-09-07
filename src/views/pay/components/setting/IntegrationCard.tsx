import { useEffect, useState } from "react";
import { IconEmail } from "@/components/icons";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE } from "@/components/ui/button/config";
import { Card } from "@/components/ui/card/Card";
import {
  integrationSettingsFromOrganization,
  organizationSettingsFromIntegration,
} from "@/api/organization";
import { useOrganizationQuery, useUpdateOrganizationMutation } from "@/hooks/use-organization-api";
import {
  INTEGRATION_FIELD,
  type ChannelConfig,
  type IntegrationFieldKey,
  type IntegrationSettings,
} from "@/hooks/use-settings-api";
import useToast from "@/hooks/use-toast";
import { IntegrationChannelCard, integrationIconImg } from "./IntegrationChannelCard";

export function IntegrationCard() {
  const toast = useToast();
  const query = useOrganizationQuery();
  const updateMutation = useUpdateOrganizationMutation();
  const saved = query.data;
  const [draft, setDraft] = useState<IntegrationSettings | null>(null);
  const savedSettingsKey = saved
    ? [
        saved.addressSettings.evmAddress,
        saved.addressSettings.nearAddress,
        saved.addressSettings.solanaAddress,
        saved.addressSettings.tronAddress,
        saved.notificationSettings.email,
        saved.notificationSettings.telegram,
        saved.notificationSettings.slack,
      ].join(":")
    : "";

  useEffect(() => {
    if (!saved) return;
    setDraft(integrationSettingsFromOrganization(saved));
  }, [saved, savedSettingsKey]);

  function patch(key: IntegrationFieldKey, next: Partial<ChannelConfig>) {
    setDraft((current) => {
      if (!current) return current;
      return { ...current, [key]: { ...current[key], ...next } };
    });
  }

  async function handleSave() {
    if (!saved || !draft) return;
    const settings = organizationSettingsFromIntegration(
      draft,
      saved.addressSettings.evmAddress,
    );
    try {
      await updateMutation.mutateAsync({
        name: saved.name,
        ...(saved.logo ? { logo: saved.logo } : {}),
        addressSettings: settings.addressSettings,
        notificationSettings: settings.notificationSettings,
      });
      toast.success({ title: "Integration saved" });
    } catch (cause) {
      toast.fail({
        title: cause instanceof Error ? cause.message : "Failed to save integration",
      });
    }
  }

  return (
    <Card className="flex flex-col p-[30px]">
      <h2 className="font-montserrat text-xl font-medium capitalize text-black">Integration</h2>
      <p className="mt-2 font-montserrat text-sm font-normal text-[#909090]">
        Select the notification integration
      </p>
      {query.isError ? (
        <p className="mt-6 font-montserrat text-sm text-danger">
          {query.error instanceof Error ? query.error.message : "Failed to load integration"}
        </p>
      ) : !draft ? (
        <p className="mt-6 font-montserrat text-sm text-[#909090]">Loading integration…</p>
      ) : (
        <>
          <p className="mt-8 font-montserrat text-sm font-medium capitalize text-[#606060]">
            Channel of notification
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <IntegrationChannelCard
              title="Email"
              icon={<IconEmail className="h-[13px] w-[17px]" />}
              config={draft.email}
              onChange={(next) => patch(INTEGRATION_FIELD.Email, next)}
            />
            <IntegrationChannelCard
              title="Telegram"
              icon={integrationIconImg("/setting/telegram.svg", "Telegram")}
              config={draft.telegram}
              onChange={(next) => patch(INTEGRATION_FIELD.Telegram, next)}
            />
            <IntegrationChannelCard
              title="Slack"
              icon={integrationIconImg("/setting/slack.svg", "Slack")}
              config={draft.slack}
              onChange={(next) => patch(INTEGRATION_FIELD.Slack, next)}
            />
          </div>
          <p className="mt-8 font-montserrat text-sm font-medium text-[#606060]">Wallet Address</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <IntegrationChannelCard
              title="EVM Address"
              config={draft.evm}
              locked
              onChange={() => undefined}
            />
            <IntegrationChannelCard
              title="SOLANA Address"
              config={draft.solana}
              onChange={(next) => patch(INTEGRATION_FIELD.Solana, next)}
            />
            <IntegrationChannelCard
              title="NEAR Address"
              config={draft.near}
              onChange={(next) => patch(INTEGRATION_FIELD.Near, next)}
            />
            <IntegrationChannelCard
              title="Tron Address"
              config={draft.tron}
              onChange={(next) => patch(INTEGRATION_FIELD.Tron, next)}
            />
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              size={BUTTON_SIZE.Sm}
              className="h-9 min-w-[120px] rounded-[8px] px-4"
              loading={updateMutation.isPending}
              onClick={() => void handleSave()}
            >
              Save
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
