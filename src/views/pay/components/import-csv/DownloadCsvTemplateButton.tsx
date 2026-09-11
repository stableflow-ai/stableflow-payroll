import { IconDownload } from "@/components/icons/download";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
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
      onClick={() => downloadImportCsvTemplate(content, filename)}
      title="Download Template"
    >
      <IconDownload className="size-3.5 shrink-0" />
    </Button>
  );
}
