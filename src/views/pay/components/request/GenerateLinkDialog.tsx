import { Button } from "@/components/ui/button/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { REQUEST_PAYMENT_COPY } from "../../config";

export function GenerateLinkDialog(props: {
  open: boolean;
  onClose: () => void;
}) {
  const { open, onClose } = props;

  return (
    <Dialog open={open} onClose={onClose} title={REQUEST_PAYMENT_COPY.COMING_SOON_TITLE}>
      {/*
        TODO(api): POST /v1/pay/request then show the live link.
        Payer URL shape: /pay?request=:id. Opening it has no payer UI this sprint
        (SinglePayoutView should later lock fields and branch on receivePrivately).
      */}
      <p className="font-montserrat text-sm leading-6 text-[#606060]">
        {REQUEST_PAYMENT_COPY.COMING_SOON_BODY}
      </p>
      <p className="mt-3 font-montserrat text-xs text-[#909090]">
        {REQUEST_PAYMENT_COPY.PAYER_URL_HINT}
      </p>
      <Button size="lg" className="mt-6 w-full" onClick={onClose}>
        OK
      </Button>
    </Dialog>
  );
}
