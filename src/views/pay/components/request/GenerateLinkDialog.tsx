import { Button } from "@/components/ui/button/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";

export function GenerateLinkDialog(props: {
  open: boolean;
  onClose: () => void;
}) {
  const { open, onClose } = props;

  return (
    <Dialog open={open} onClose={onClose} title="Coming soon">
      {/*
        TODO(api): POST /v1/pay/request then show the live link.
        Payer URL shape: /pay?request=:id. Opening it has no payer UI this sprint
        (SinglePayoutView should later lock fields and branch on receivePrivately).
      */}
      <p className="font-montserrat text-sm leading-6 text-[#606060]">
        Payment links will be available once the request API is ready.
      </p>
      <p className="mt-3 font-montserrat text-xs text-[#909090]">
        Payer URL (not live): /pay?request=:id
      </p>
      <Button size="lg" className="mt-6 w-full" onClick={onClose}>
        OK
      </Button>
    </Dialog>
  );
}
