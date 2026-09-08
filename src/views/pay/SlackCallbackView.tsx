import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { IconCheck2 } from "@/components/icons/check";
import { IconLoading } from "@/components/icons/loading";
import { Card } from "@/components/ui/card/Card";
import {
  useSlackOAuthMutation,
  useUpdateNotificationSettingsMutation,
} from "@/hooks/use-organization-api";
import { ORGANIZATION_FIELD_STATUS, type SlackOAuthResult } from "@/types/organization";
import { SETTING_PATH } from "@/views/pay/config";
import { SLACK_CALLBACK_REDIRECT_MS } from "./components/setting/config";

const slackCallbackTasks = new Map<string, Promise<SlackOAuthResult>>();

export function SlackCallbackView() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const oauthMutation = useSlackOAuthMutation();
  const notificationMutation = useUpdateNotificationSettingsMutation();
  const oauth = oauthMutation.mutateAsync;
  const saveSlack = notificationMutation.mutateAsync;
  const code = params.get("code")?.trim() ?? "";
  const state = params.get("state")?.trim() ?? "";
  const [status, setStatus] = useState<"working" | "success" | "error">(
    code && state ? "working" : "error",
  );
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState(
    code && state ? "" : "Missing Slack authorization parameters",
  );

  useEffect(() => {
    if (!code || !state) return;
    let cancelled = false;
    const key = `${code}:${state}`;
    const existing = slackCallbackTasks.get(key);
    const task =
      existing ??
      (async () => {
        const team = await oauth({ code, state });
        await saveSlack({
          slack: ORGANIZATION_FIELD_STATUS.Required,
        });
        return team;
      })();
    if (!existing) {
      slackCallbackTasks.set(key, task);
      task.catch(() => {
        slackCallbackTasks.delete(key);
      });
    }

    void task
      .then((team) => {
        if (cancelled) return;
        setTeamName(team.slackTeamName);
        setStatus("success");
      })
      .catch((cause) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Failed to connect Slack");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [code, oauth, saveSlack, state]);

  useEffect(() => {
    if (status !== "success") return;
    const timer = window.setTimeout(() => {
      navigate(SETTING_PATH, { replace: true });
    }, SLACK_CALLBACK_REDIRECT_MS);
    return () => window.clearTimeout(timer);
  }, [navigate, status]);

  const title =
    status === "success"
      ? "Slack connected"
      : status === "error"
        ? "Could not connect Slack"
        : "Connecting Slack";
  const detail =
    status === "success"
      ? teamName
        ? `Connected to ${teamName}. Redirecting to Settings…`
        : "Redirecting to Settings…"
      : status === "error"
        ? error
        : "Finishing Slack authorization. This may take a moment.";

  return (
    <Card className="mx-auto flex w-full max-w-[560px] flex-col items-center px-6 py-8 text-center sm:px-8">
      {status === "success" ? (
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-[#769400]/10">
          <IconCheck2 className="size-5 text-[#769400]" />
        </span>
      ) : status === "working" ? (
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-[#6284F5]/10">
          <IconLoading className="size-5 animate-spin text-[#6284F5]" />
        </span>
      ) : (
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-danger/10">
          <span className="font-montserrat text-lg font-semibold text-danger">!</span>
        </span>
      )}
      <h2 className="mt-4 font-montserrat text-xl font-semibold text-black">{title}</h2>
      <p className="mt-2 font-montserrat text-sm font-normal text-[#909090]">{detail}</p>
      {status === "error" ? (
        <Link
          to={SETTING_PATH}
          className="mt-6 font-montserrat text-sm font-medium text-[#06f] hover:opacity-70"
        >
          Back to Settings
        </Link>
      ) : null}
    </Card>
  );
}
