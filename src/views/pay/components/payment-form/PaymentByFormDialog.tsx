import { Dialog } from "@/components/ui/dialog/Dialog";
import { PaymentByFormCard } from "./PaymentByFormCard";

export function PaymentByFormDialog(props: {
  open: boolean;
  onClose: () => void;
  formId: string | null;
}) {
  const { open, onClose, formId } = props;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Pay Now"
      cardClassName="w-full md:w-[600px]"
    >
      {formId ? (
        <PaymentByFormCard
          key={formId}
          formId={formId}
          formLocked
          onSettled={onClose}
        />
      ) : null}
    </Dialog>
  );
}
