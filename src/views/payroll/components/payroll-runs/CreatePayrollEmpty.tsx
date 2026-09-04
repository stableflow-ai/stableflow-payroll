import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconArrowDown } from "@/components/icons/arrow-down";
import { IconDownload } from "@/components/icons/download";
import { IconImportFile } from "@/components/icons/import-file";
import { IconPlus } from "@/components/icons/plus";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import {
  IMPORT_CSV_TEMPLATE,
  IMPORT_CSV_TEMPLATE_FILENAME,
  PAYROLL_CREATE_PATH,
} from "../../config";
import { ImportCsvMenu } from "./ImportCsvMenu";

function downloadTemplate() {
  const blob = new Blob([IMPORT_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = IMPORT_CSV_TEMPLATE_FILENAME;
  link.click();
  URL.revokeObjectURL(url);
}

export function CreatePayrollEmpty(props: { onAddPayroll: () => void }) {
  const { onAddPayroll } = props;
  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [importOpen, setImportOpen] = useState(false);
  const importWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!importOpen || !isDesktop) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (importWrapRef.current?.contains(target)) return;
      setImportOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setImportOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [importOpen, isDesktop]);

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-4 py-16">
      <p className="font-montserrat text-base font-semibold text-black">
        Starts with Create a Payroll
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <Button
          variant={BUTTON_VARIANT.Normal}
          className="h-10 w-full rounded-[10px] border-black/10 px-4 text-sm text-black sm:w-auto sm:min-w-[193px]"
          onClick={downloadTemplate}
        >
          <IconDownload className="size-3.5 shrink-0" />
          Download Template
        </Button>
        <div ref={importWrapRef} className="relative w-full sm:w-auto">
          <Button
            className="h-10 w-full rounded-[10px] px-4 text-sm sm:w-auto sm:min-w-[167px]"
            aria-expanded={importOpen}
            aria-haspopup="menu"
            onClick={() => setImportOpen((open) => !open)}
          >
            <IconImportFile className="size-3.5 shrink-0" />
            Import CSV
            <IconArrowDown
              className={cn(
                "h-1 w-2.5 shrink-0 transition-transform",
                importOpen && "rotate-180",
              )}
            />
          </Button>
          <ImportCsvMenu
            open={importOpen}
            isDesktop={isDesktop}
            onClose={() => setImportOpen(false)}
            onSelect={() => navigate(PAYROLL_CREATE_PATH)}
          />
        </div>
        <span className="hidden font-montserrat text-sm font-medium text-black sm:inline">
          or
        </span>
        <Button
          className="h-10 w-full rounded-[10px] px-4 text-sm sm:w-auto sm:min-w-[147px]"
          onClick={onAddPayroll}
        >
          <IconPlus className="size-3 shrink-0" />
          Add Payroll
        </Button>
      </div>
    </div>
  );
}
