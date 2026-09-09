import { Dialog } from "@/components/ui/dialog/Dialog";
import type { Payable } from "@/types/payable";
import { payableKeyId } from "@/types/payable";
import { PaymentByFormCard } from "./PaymentByFormCard";

export function PaymentByFormDialog(props: {
  open: boolean;
  onClose: () => void;
  form: Payable | null;
  initialNetPayById?: Record<number, string>;
}) {
  const { open, onClose, form, initialNetPayById } = props;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Pay Now"
      cardClassName="w-full md:w-[600px]"
    >
      {form ? (
        <PaymentByFormCard
          key={payableKeyId(form.key)}
          form={form}
          formLocked
          initialNetPayById={initialNetPayById}
          onSettled={onClose}
        />
      ) : null}
    </Dialog>
  );
}
