import { IconEmail } from "@/components/icons";
import { Card } from "@/components/ui/card/Card";
import {
  INTEGRATION_FIELD,
  useIntegrationSettingsQuery,
  useUpdateIntegrationMutation,
  type ChannelConfig,
  type IntegrationFieldKey,
} from "@/hooks/use-settings-api";
import useToast from "@/hooks/use-toast";
import { IntegrationChannelCard, integrationIconImg } from "./IntegrationChannelCard";

export function IntegrationCard() {
  const toast = useToast();
  const query = useIntegrationSettingsQuery();
  const updateMutation = useUpdateIntegrationMutation();
  const settings = query.data;

  function patch(key: IntegrationFieldKey, next: Partial<ChannelConfig>) {
    void updateMutation.mutateAsync({ key, patch: next }).catch((error) => {
      toast.fail({
        title: error instanceof Error ? error.message : "Failed to save integration",
      });
    });
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
      ) : !settings ? (
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
              config={settings.email}
              onChange={(next) => patch(INTEGRATION_FIELD.Email, next)}
            />
            <IntegrationChannelCard
              title="Telegram"
              icon={integrationIconImg("/setting/telegram.svg", "Telegram")}
              config={settings.telegram}
              onChange={(next) => patch(INTEGRATION_FIELD.Telegram, next)}
            />
            <IntegrationChannelCard
              title="Slack"
              icon={integrationIconImg("/setting/slack.svg", "Slack")}
              config={settings.slack}
              onChange={(next) => patch(INTEGRATION_FIELD.Slack, next)}
            />
          </div>
          <p className="mt-8 font-montserrat text-sm font-medium text-[#606060]">Wallet Address</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <IntegrationChannelCard
              title="EVM Address"
              config={settings.evm}
              locked
              onChange={() => undefined}
            />
            <IntegrationChannelCard
              title="SOLANA Address"
              config={settings.solana}
              onChange={(next) => patch(INTEGRATION_FIELD.Solana, next)}
            />
            <IntegrationChannelCard
              title="NEAR Address"
              config={settings.near}
              onChange={(next) => patch(INTEGRATION_FIELD.Near, next)}
            />
            <IntegrationChannelCard
              title="Tron Address"
              config={settings.tron}
              onChange={(next) => patch(INTEGRATION_FIELD.Tron, next)}
            />
          </div>
        </>
      )}
    </Card>
  );
}
