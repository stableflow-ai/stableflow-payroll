import { Button } from "@/components/ui/button/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";
import type { PayPartnerKey } from "@/types/partner";

export function DeleteApiKeyDialog(props: {
  open: boolean;
  onClose: () => void;
  apiKey: PayPartnerKey | null;
  onConfirm: () => void;
}) {
  const { open, onClose, apiKey, onConfirm } = props;

  return (
    <Dialog open={open} onClose={onClose} title="Delete API key?" cardClassName="md:w-[300px]">
      <p className="font-montserrat text-sm text-[#606060]">
        {apiKey
          ? `Delete ${apiKey.label} from your API keys? This cannot be undone.`
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
