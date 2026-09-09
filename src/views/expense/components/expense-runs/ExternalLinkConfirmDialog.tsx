import { Button } from "@/components/ui/button/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";

export function ExternalLinkConfirmDialog(props: {
  open: boolean;
  url: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { open, url, onClose, onConfirm } = props;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Open this link?"
      cardClassName="md:w-[360px]"
    >
      <p className="font-montserrat text-sm text-[#606060]">
        This link will open in a new tab. It is not affiliated with this site.
        Please proceed with caution.
      </p>
      {url ? (
        <p className="mt-3 break-all font-montserrat text-sm text-[#6284F5]">
          {url}
        </p>
      ) : null}
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
