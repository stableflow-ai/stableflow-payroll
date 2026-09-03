import { Button } from "@/components/ui/button/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";
import type { TeamMember } from "@/hooks/use-team-api";

export function RemoveMemberDialog(props: {
  open: boolean;
  onClose: () => void;
  member: TeamMember | null;
  onConfirm: () => void;
}) {
  const { open, onClose, member, onConfirm } = props;

  return (
    <Dialog open={open} onClose={onClose} title="Remove member?" cardClassName="md:w-[300px]">
      <p className="font-montserrat text-sm text-[#606060]">
        {member
          ? `Remove ${member.name} from the team? This cannot be undone.`
          : "This cannot be undone."}
      </p>
      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          size="sm"
          className="border-transparent bg-danger text-white hover:opacity-90"
          onClick={onConfirm}
        >
          Remove
        </Button>
        <Button size="sm" variant="normal" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Dialog>
  );
}
