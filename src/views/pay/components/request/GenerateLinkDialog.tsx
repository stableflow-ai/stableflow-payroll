import { useState } from "react";
import { IconLink } from "@stableflow/pay-ui/icons/link";
import { IconSuccess } from "@stableflow/pay-ui/icons/success";
import { Button } from "@stableflow/pay-ui/button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@stableflow/pay-ui/button";
import { Dialog } from "@stableflow/pay-ui/dialog";
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
        <Button
          type="button"
          variant={BUTTON_VARIANT.Normal}
          size={BUTTON_SIZE.Xl}
          loading={copying}
          className="mt-8 h-14 w-full border-[#e3e3e3] text-black shadow-none"
          onClick={() => {
            void copyLink();
          }}
        >
          <IconLink className="size-3.5 shrink-0" />
          Copy Link
        </Button>
      </div>
    </Dialog>
  );
}
