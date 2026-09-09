import { Button } from "@/components/ui/button/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";

export function ExternalLinkConfirmDialog(props: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { open, onClose, onConfirm } = props;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Leave this site?"
      cardClassName="md:w-[360px]"
    >
      <p className="font-montserrat text-sm text-[#606060]">
        You are about to open a third-party page. It is not affiliated with
        this site. Please proceed with caution.
      </p>
      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          size="sm"
          className="flex-1 border-transparent bg-danger text-white hover:opacity-90"
          onClick={onConfirm}
        >
          Confirm
        </Button>
        <Button className="flex-1" size="sm" variant="normal" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Dialog>
  );
}
