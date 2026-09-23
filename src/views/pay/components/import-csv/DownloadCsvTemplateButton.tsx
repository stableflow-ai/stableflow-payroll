import { IconDownload } from "@stableflow/pay-ui/icons/download";
import { Button } from "@stableflow/pay-ui/button";
import { BUTTON_VARIANT } from "@stableflow/pay-ui/button";
import { cn } from "@/lib/utils";
import { downloadImportCsvTemplate } from "./download-template";

export function DownloadCsvTemplateButton(props: {
  content: string;
  filename: string;
  disabled?: boolean;
  className?: string;
}) {
  const { content, filename, disabled = false, className } = props;

  return (
    <Button
      variant={BUTTON_VARIANT.Normal}
      aria-label="Download Template"
      disabled={disabled}
      className={cn(
        "h-9 w-9 rounded-[10px] border-black/10 px-0 text-black",
        className,
      )}
      onClick={() => void downloadImportCsvTemplate(content, filename)}
      title="Download Template"
    >
      <IconDownload className="size-3.5 shrink-0" />
    </Button>
  );
}
