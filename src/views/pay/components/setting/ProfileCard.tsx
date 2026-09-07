import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE } from "@/components/ui/button/config";
import { Card } from "@/components/ui/card/Card";
import { useUpdateProfileMutation } from "@/hooks/use-auth-api";
import useToast from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth";
import { ResetPasswordDialog } from "@/views/auth/ResetPasswordDialog";
import { RESET_PASSWORD_VARIANT, nameRuleError } from "@/views/auth/config";
import { CONTACT_NAME_MAX_LENGTH } from "../../config";
import { cn } from "@/lib/utils";

const FIELD_CLASS =
  "h-10 w-full rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-3 font-montserrat text-sm font-medium text-black outline-none placeholder:text-black/30";

export function ProfileCard() {
  const toast = useToast();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const applySession = useAuthStore((state) => state.applySession);
  const updateMutation = useUpdateProfileMutation();
  const [name, setName] = useState(user?.name ?? "");
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  async function handleSave() {
    const trimmed = name.trim();
    const error = nameRuleError(trimmed);
    if (error) {
      toast.fail({ title: error });
      return;
    }
    if (!token || !user) return;
    try {
      if (!token.startsWith("mock:")) {
        await updateMutation.mutateAsync({ name: trimmed });
      }
      applySession(token, { ...user, name: trimmed });
      toast.success({ title: "Profile saved" });
    } catch (cause) {
      toast.fail({
        title: cause instanceof Error ? cause.message : "Failed to save profile",
      });
    }
  }

  return (
    <Card className="flex flex-col p-[30px]">
      <h2 className="font-montserrat text-xl font-medium capitalize text-black">Profile</h2>
      <p className="mt-2 font-montserrat text-sm font-normal text-[#909090]">Update your profile</p>
      <label className="mt-6 block">
        <span className="font-montserrat text-sm font-medium text-[#606060]">Name</span>
        <input
          className={`${FIELD_CLASS} mt-2`}
          value={name}
          maxLength={CONTACT_NAME_MAX_LENGTH}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <div className="mt-6">
        <span className="font-montserrat text-sm font-medium text-[#606060]">Account Email</span>
        <div className="relative mt-2">
          <p className={cn(
            FIELD_CLASS,
            "border-0 bg-transparent",
            "flex items-center pr-32",
          )}>{user?.email}</p>
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 font-montserrat text-xs font-medium capitalize text-[#3f8afb] hover:opacity-80"
            onClick={() => setResetOpen(true)}
          >
            Reset Password
          </button>
        </div>
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
      <ResetPasswordDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        variant={RESET_PASSWORD_VARIANT.Authed}
      />
    </Card>
  );
}
