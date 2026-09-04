import { useState } from "react";
import { IconLink, IconOutLink, IconSuccess } from "@/components/icons";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/button/config";
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
    <Dialog
      open={open}
      onClose={onClose}
      title=""
      titleClassName="sr-only"
      closeClassName="text-[#909090]"
      cardClassName="md:w-[600px] gap-0 px-[30px] pb-[30px] pt-[26px]"
    >
      <div className="flex flex-col items-center">
        <IconSuccess className="size-[54px] text-[#769400]" />
        <p className="mt-6 text-center font-montserrat text-base font-semibold text-black">
          Payment link has been generated
        </p>
        <div className="mt-4 flex h-[72px] w-full items-center justify-center rounded-[20px] border border-white bg-[#fdfdfd] px-4 shadow-[0px_0px_20px_0px_rgba(0,0,0,0.06)]">
          <p className="truncate text-center font-montserrat text-base font-medium text-black" title={url}>
            {url}
          </p>
        </div>
        <div className="mt-8 flex w-full gap-4">
          <Button
            type="button"
            variant={BUTTON_VARIANT.Normal}
            size={BUTTON_SIZE.Xl}
            className="h-14 flex-1 border-[#e3e3e3] text-black shadow-none"
          >
            <IconOutLink className="size-3.5 shrink-0" />
            Preview
          </Button>
          <Button
            type="button"
            variant={BUTTON_VARIANT.Normal}
            size={BUTTON_SIZE.Xl}
            loading={copying}
            className="h-14 flex-1 border-[#e3e3e3] text-black shadow-none"
            onClick={() => {
              void copyLink();
            }}
          >
            <IconLink className="size-3.5 shrink-0" />
            Copy Link
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
