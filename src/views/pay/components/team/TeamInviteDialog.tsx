import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import useToast from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { TeamInviteWrite } from "@/hooks/use-team-api";
import { CONTACT_NAME_MAX_LENGTH, EMAIL_MAX_LENGTH } from "../../config";
import { isValidEmail } from "../../utils";
import {
  TEAM_INVITE_ROLE,
  TEAM_INVITE_ROLE_OPTIONS,
  TEAM_INVITE_TYPE,
  type TeamInviteRole,
} from "./config";

const FIELD_CLASS =
  "h-9 w-full rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-3 font-montserrat text-sm font-medium text-black outline-none placeholder:text-[#aaa]";

export function TeamInviteDialog(props: {
  open: boolean;
  onClose: () => void;
  onSend: (input: TeamInviteWrite) => Promise<void>;
  sending?: boolean;
}) {
  const { open, onClose, onSend, sending = false } = props;
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamInviteRole>(TEAM_INVITE_ROLE.Developer);

  useEffect(() => {
    if (!open) return;
    setName("");
    setEmail("");
    setRole(TEAM_INVITE_ROLE.Developer);
  }, [open]);

  async function handleSubmit() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      toast.fail({ title: "Name is required" });
      return;
    }
    if (!trimmedEmail) {
      toast.fail({ title: "Email is required" });
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      toast.fail({ title: "Enter a valid email" });
      return;
    }
    await onSend({ name: trimmedName, email: trimmedEmail, role });
  }

  return (
    <Dialog open={open} onClose={onClose} title="Invite">
      <p className="-mt-1 font-montserrat text-xs font-normal text-[#909090]">
        Invite a colleague to create their own Stableflow Pay account.
      </p>
      <label className="mt-4 block">
        <span className="font-montserrat text-sm font-medium text-[#606060]">Name</span>
        <input
          className={cn(FIELD_CLASS, "mt-2")}
          value={name}
          maxLength={CONTACT_NAME_MAX_LENGTH}
          placeholder="Andrew"
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="mt-4 block">
        <span className="font-montserrat text-sm font-medium text-[#606060]">Email</span>
        <input
          type="email"
          className={cn(FIELD_CLASS, "mt-2")}
          value={email}
          maxLength={EMAIL_MAX_LENGTH}
          placeholder="name@company.com"
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-montserrat text-sm font-medium text-[#606060]">Type</span>
          <input
            className={cn(FIELD_CLASS, "mt-2 cursor-not-allowed bg-white opacity-60")}
            value={TEAM_INVITE_TYPE}
            readOnly
            disabled
          />
        </label>
        <div>
          <span className="font-montserrat text-sm font-medium text-[#606060]">Role</span>
          <Dropdown
            className="mt-2 w-full"
            triggerClassName="w-full bg-white"
            value={role}
            onChange={(value) => setRole(value as TeamInviteRole)}
            options={TEAM_INVITE_ROLE_OPTIONS}
          />
        </div>
      </div>
      <Button
        size="lg"
        className="mt-6 w-full"
        disabled={sending}
        loading={sending}
        onClick={() => void handleSubmit()}
      >
        Send an invitation
      </Button>
    </Dialog>
  );
}
