import { Button } from "@/components/ui/button/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";
import type { ReceivedPaymentView } from "../../request-utils";

export function DeletePaymentRequestDialog(props: {
  open: boolean;
  onClose: () => void;
  row: ReceivedPaymentView | null;
  loading?: boolean;
  onConfirm: () => void;
}) {
  const { open, onClose, row, loading = false, onConfirm } = props;

  return (
    <Dialog open={open} onClose={onClose} title="Delete request?" cardClassName="md:w-[320px]">
      <p className="font-montserrat text-sm text-[#606060]">
        {row?.paymentName.trim()
          ? `Delete “${row.paymentName.trim()}”? The issued link will be invalid.`
          : "The issued link will be invalid."}
      </p>
      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          size="sm"
          loading={loading}
          className="border-transparent bg-danger text-white hover:opacity-90"
          onClick={onConfirm}
        >
          Delete
        </Button>
        <Button size="sm" variant="normal" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </div>
    </Dialog>
  );
}
