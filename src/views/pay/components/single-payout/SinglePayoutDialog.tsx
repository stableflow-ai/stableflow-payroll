import { Dialog } from "@/components/ui/dialog/Dialog";
import type { TeamMemberWallets } from "@/types/team";
import { memberDisplayWallet } from "../team/utils";
import { SinglePayoutCard } from "./SinglePayoutCard";

export type SinglePayoutRecipient = {
  name: string;
  wallets: TeamMemberWallets;
};

export function SinglePayoutDialog(props: {
  open: boolean;
  onClose: () => void;
  recipient: SinglePayoutRecipient | null;
}) {
  const { open, onClose, recipient } = props;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Pay Now"
      cardClassName="w-full md:w-[600px]"
    >
      {recipient ? (
        <SinglePayoutCard
          key={`${recipient.name}-${memberDisplayWallet(recipient) ?? "empty"}`}
          initialRecipient={{
            name: recipient.name,
            address: memberDisplayWallet(recipient) ?? "",
          }}
          memberWallets={recipient.wallets}
        />
      ) : null}
    </Dialog>
  );
}
