import { Dialog } from "@/components/ui/dialog/Dialog";
import type { TeamMember } from "@/hooks/use-team-api";
import { SinglePayoutCard } from "../single-payout/SinglePayoutCard";
import { memberDisplayWallet } from "./utils";

export function TeamPayNowDialog(props: {
  open: boolean;
  onClose: () => void;
  member: TeamMember | null;
}) {
  const { open, onClose, member } = props;
  const address = member ? memberDisplayWallet(member) : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Pay Now"
      cardClassName="w-full md:w-[600px]"
    >
      {member && address ? (
        <SinglePayoutCard
          key={member.id}
          recipientLocked
          initialRecipient={{ name: member.name, address }}
        />
      ) : null}
    </Dialog>
  );
}
