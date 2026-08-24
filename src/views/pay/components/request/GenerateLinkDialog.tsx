import { useState } from "react";
import { IconCopy } from "@/components/icons/copy";
import { Button } from "@/components/ui/button/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";
import useToast from "@/hooks/use-toast";

export function GenerateLinkDialog(props: {
  open: boolean;
  url: string;
  onClose: () => void;
}) {
  const { open, url, onClose } = props;
  const toast = useToast();
  const [copying, setCopying] = useState(false);

  async function copyLink() {
    if (!url) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(url);
      toast.success({ title: "Copied" });
    } catch {
      toast.fail({ title: "Could not copy" });
    } finally {
      setCopying(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Payment link">
      <p className="font-montserrat text-sm leading-6 text-[#606060]">
        Send this link to the payer. They will open Single Payout with the amount and address filled in.
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-[8px] border border-[#e3e3e3] bg-[#f6f6f6] px-3 py-2">
        <p className="min-w-0 flex-1 break-all font-montserrat text-xs text-black">{url}</p>
        <button
          type="button"
          aria-label="Copy payment link"
          onClick={() => {
            void copyLink();
          }}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-black/10 bg-white text-black"
        >
          <IconCopy className="size-4" />
        </button>
      </div>
      <Button size="lg" className="mt-6 w-full" loading={copying} onClick={() => void copyLink()}>
        Copy link
      </Button>
    </Dialog>
  );
}
