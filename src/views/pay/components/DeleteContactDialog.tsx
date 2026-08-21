import { Button } from "@/components/ui/button/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";
import type { Contact } from "@/hooks/use-contacts";

export function DeleteContactDialog(props: {
  open: boolean;
  onClose: () => void;
  contact: Contact | null;
  onConfirm: () => void;
}) {
  const { open, onClose, contact, onConfirm } = props;

  return (
    <Dialog open={open} onClose={onClose} title="Delete contact?" cardClassName="md:w-[300px]">
      <p className="font-montserrat text-sm text-[#606060]">
        {contact
          ? `Delete ${contact.name} from your recipients? This cannot be undone.`
          : "This cannot be undone."}
      </p>
      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          size="sm"
          className="border-transparent bg-danger text-white hover:opacity-90"
          onClick={onConfirm}
        >
          Delete
        </Button>
        <Button size="sm" variant="normal" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Dialog>
  );
}
