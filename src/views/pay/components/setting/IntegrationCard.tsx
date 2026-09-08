import { useEffect, useRef, useState } from "react";
import { IconEmail } from "@/components/icons";
import { Card } from "@/components/ui/card/Card";
import {
  integrationSettingsFromOrganization,
  statusFromChannelConfig,
} from "@/api/organization";
import {
  useConnectSlackMutation,
  useOrganizationQuery,
  useUpdateAddressSettingsMutation,
  useUpdateNotificationSettingsMutation,
} from "@/hooks/use-organization-api";
import {
  INTEGRATION_FIELD,
  type ChannelConfig,
  type IntegrationFieldKey,
  type IntegrationSettings,
} from "@/hooks/use-settings-api";
import useToast from "@/hooks/use-toast";
import { ADDRESS_SETTING_FIELD } from "./config";
import { IntegrationChannelCard, integrationIconImg } from "./IntegrationChannelCard";

export function IntegrationCard() {
  const toast = useToast();
  const query = useOrganizationQuery();
  const addressMutation = useUpdateAddressSettingsMutation();
  const notificationMutation = useUpdateNotificationSettingsMutation();
  const connectSlackMutation = useConnectSlackMutation();
  const saved = query.data;
  const [draft, setDraft] = useState<IntegrationSettings | null>(null);
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<IntegrationFieldKey>>(
    () => new Set(),
  );
  const pendingCount = useRef(0);
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
    if (!saved || pendingCount.current > 0) return;
    setDraft(integrationSettingsFromOrganization(saved));
  }, [saved, savedSettingsKey]);

  function patch(key: IntegrationFieldKey, next: Partial<ChannelConfig>) {
    setDraft((current) => {
      if (!current) return current;
      return { ...current, [key]: { ...current[key], ...next } };
    });
  }

  function beginPending(key: IntegrationFieldKey) {
    pendingCount.current += 1;
    setPendingKeys((current) => new Set(current).add(key));
  }

  function endPending(key: IntegrationFieldKey) {
    pendingCount.current = Math.max(0, pendingCount.current - 1);
    setPendingKeys((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }

  async function persist(key: IntegrationFieldKey, next: Partial<ChannelConfig>) {
    if (!draft) return;
    const current = draft[key];
    const merged = { ...current, ...next };
    const status = statusFromChannelConfig(merged);

    if (key === INTEGRATION_FIELD.Slack && next.enabled === true && !current.enabled) {
      beginPending(key);
      try {
        const { authorizationUrl } = await connectSlackMutation.mutateAsync();
        window.location.assign(authorizationUrl);
      } catch (cause) {
        endPending(key);
        toast.fail({
          title: cause instanceof Error ? cause.message : "Failed to connect Slack",
        });
      }
      return;
    }

    beginPending(key);
    patch(key, next);
    try {
      if (
        key === INTEGRATION_FIELD.Near ||
        key === INTEGRATION_FIELD.Solana ||
        key === INTEGRATION_FIELD.Tron
      ) {
        await addressMutation.mutateAsync({
          [ADDRESS_SETTING_FIELD[key]]: status,
        });
      } else if (key === INTEGRATION_FIELD.Slack || key === INTEGRATION_FIELD.Telegram) {
        await notificationMutation.mutateAsync({ [key]: status });
      }
    } catch (cause) {
      patch(key, current);
      toast.fail({
        title: cause instanceof Error ? cause.message : "Failed to save integration",
      });
    } finally {
      endPending(key);
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
              locked
              onChange={() => undefined}
            />
            {/* <IntegrationChannelCard
              title="Telegram"
              icon={integrationIconImg("/setting/telegram.svg", "Telegram")}
              config={draft.telegram}
              saving={pendingKeys.has(INTEGRATION_FIELD.Telegram)}
              onChange={(next) => void persist(INTEGRATION_FIELD.Telegram, next)}
            /> */}
            <IntegrationChannelCard
              title="Slack"
              icon={integrationIconImg("/setting/slack.svg", "Slack")}
              config={draft.slack}
              saving={pendingKeys.has(INTEGRATION_FIELD.Slack)}
              onChange={(next) => void persist(INTEGRATION_FIELD.Slack, next)}
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
              saving={pendingKeys.has(INTEGRATION_FIELD.Solana)}
              onChange={(next) => void persist(INTEGRATION_FIELD.Solana, next)}
            />
            <IntegrationChannelCard
              title="NEAR Address"
              config={draft.near}
              saving={pendingKeys.has(INTEGRATION_FIELD.Near)}
              onChange={(next) => void persist(INTEGRATION_FIELD.Near, next)}
            />
            <IntegrationChannelCard
              title="Tron Address"
              config={draft.tron}
              saving={pendingKeys.has(INTEGRATION_FIELD.Tron)}
              onChange={(next) => void persist(INTEGRATION_FIELD.Tron, next)}
            />
          </div>
        </>
      )}
    </Card>
  );
}
