import { Dialog } from "@/components/ui/dialog/Dialog";
import { SinglePayoutCard } from "./SinglePayoutCard";

export type SinglePayoutRecipient = {
  name: string;
  address: string;
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
      {recipient?.address ? (
        <SinglePayoutCard
          key={recipient.address}
          recipientLocked
          initialRecipient={recipient}
        />
      ) : null}
    </Dialog>
  );
}
