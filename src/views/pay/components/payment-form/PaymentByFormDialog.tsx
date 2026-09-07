import { Dialog } from "@/components/ui/dialog/Dialog";
import type { PayableKey } from "@/types/payable";
import { payableKeyId } from "@/types/payable";
import { PaymentByFormCard } from "./PaymentByFormCard";

export function PaymentByFormDialog(props: {
  open: boolean;
  onClose: () => void;
  payable: PayableKey | null;
}) {
  const { open, onClose, payable } = props;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Pay Now"
      cardClassName="w-full md:w-[600px]"
    >
      {payable ? (
        <PaymentByFormCard
          key={payableKeyId(payable)}
          payable={payable}
          formLocked
          onSettled={onClose}
        />
      ) : null}
    </Dialog>
  );
}
