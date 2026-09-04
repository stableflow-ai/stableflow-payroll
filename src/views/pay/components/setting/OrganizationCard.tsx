import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE } from "@/components/ui/button/config";
import { Card } from "@/components/ui/card/Card";
import { readStoredOrganization, useUpdateOrganizationMutation } from "@/hooks/use-organization-api";
import useToast from "@/hooks/use-toast";
import { organizationName } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import { createOrganizationFormError, LOGO_URL_MAX_LENGTH, ORGANIZATION_NAME_MAX_LENGTH } from "@/views/auth/config";
import { TeamActionButtons } from "./TeamActionButtons";

const FIELD_CLASS =
  "h-10 w-full rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-3 font-montserrat text-sm font-medium text-black outline-none placeholder:text-black/30";

export function OrganizationCard(props: {
  onAddMember: () => void;
  onInvite: () => void;
}) {
  const { onAddMember, onInvite } = props;
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const updateMutation = useUpdateOrganizationMutation();
  const stored = readStoredOrganization();
  const [name, setName] = useState(organizationName(user) ?? stored?.name ?? "");
  const [logoUrl, setLogoUrl] = useState(stored?.logoUrl ?? "");

  useEffect(() => {
    setName(organizationName(user) ?? stored?.name ?? "");
  }, [stored?.name, user]);

  async function handleSave() {
    const error = createOrganizationFormError(name, logoUrl);
    if (error) {
      toast.fail({ title: error });
      return;
    }
    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        logoUrl: logoUrl.trim() || undefined,
      });
      toast.success({ title: "Organization saved" });
    } catch (cause) {
      toast.fail({
        title: cause instanceof Error ? cause.message : "Failed to save organization",
      });
    }
  }

  return (
    <Card className="flex flex-col p-[30px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-montserrat text-xl font-medium capitalize text-black">Organization</h2>
          <p className="mt-2 font-montserrat text-sm font-normal text-[#909090]">
            Update how your organization appears in Pay.Stableflow
          </p>
        </div>
        <TeamActionButtons onAddMember={onAddMember} onInvite={onInvite} />
      </div>
      <label className="mt-6 block">
        <span className="font-montserrat text-sm font-medium text-[#606060]">Organization Name</span>
        <input
          className={`${FIELD_CLASS} mt-2`}
          value={name}
          maxLength={ORGANIZATION_NAME_MAX_LENGTH}
          placeholder="Your organization name"
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="mt-6 block">
        <span className="font-montserrat text-sm font-medium text-[#606060]">Logo URL</span>
        <span className="ml-2 font-montserrat text-xs font-normal text-[#909090]">Optional</span>
        <input
          className={`${FIELD_CLASS} mt-2`}
          value={logoUrl}
          maxLength={LOGO_URL_MAX_LENGTH}
          placeholder="Your organization logo url"
          onChange={(event) => setLogoUrl(event.target.value)}
        />
      </label>
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
    </Card>
  );
}
