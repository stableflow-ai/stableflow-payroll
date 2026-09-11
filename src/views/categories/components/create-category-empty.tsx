import { useEffect, useRef, useState } from "react";
import { IconArrowDown } from "@/components/icons/arrow-down";
import { IconDownload } from "@/components/icons/download";
import { IconImportFile } from "@/components/icons/import-file";
import { IconPlus } from "@/components/icons/plus";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import { useMediaQuery } from "@/hooks/use-media-query";
import useToast from "@/hooks/use-toast";
import { isGoogleImportConfigured } from "@/lib/google/config";
import { isGooglePickerCancelled, openSpreadsheetPicker } from "@/lib/google/picker";
import { listSheetTitles, readSheetValues } from "@/lib/google/sheets";
import { isGoogleAuthCancelled, getDriveFileToken } from "@/lib/google/token-client";
import { parseCsvFile } from "@/lib/import/csv";
import { cn } from "@/lib/utils";
import { SelectSheetDialog } from "@/views/pay/components/batch/SelectSheetDialog";
import { ImportCsvMenu, type ImportCsvSource } from "@/views/pay/components/import-csv/ImportCsvMenu";
import { downloadImportCsvTemplate } from "@/views/pay/components/import-csv/download-template";
import {
  IMPORT_CSV_ACCEPT,
  IMPORT_CSV_TEMPLATE,
} from "@/views/pay/config";
import {
  CATEGORIES_DRAWER_DESKTOP_QUERY,
  CATEGORY_IMPORT_CSV_TEMPLATE_FILENAME,
} from "../config";

function importedRowCount(values: string[][]): number {
  return values.filter((row) => row.some((cell) => cell.trim() !== "")).length;
}

export function CreateCategoryEmpty() {
  const toast = useToast();
  const isDesktop = useMediaQuery(CATEGORIES_DRAWER_DESKTOP_QUERY);
  const [importOpen, setImportOpen] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const importWrapRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingSheets, setPendingSheets] = useState<{
    id: string;
    name: string;
    titles: string[];
  } | null>(null);

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

  function applyValues(values: string[][]) {
    const count = importedRowCount(values);
    if (count === 0) {
      toast.fail({ title: "No rows found" });
      return;
    }
    toast.success({ title: `Imported ${count} rows` });
  }

  async function handleCsvFile(file: File | undefined) {
    if (!file || importBusy) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".csv") && file.type !== "text/csv") {
      toast.fail({ title: "Please upload a CSV file" });
      return;
    }
    setImportBusy(true);
    try {
      const values = await parseCsvFile(file);
      applyValues(values);
    } catch {
      toast.fail({ title: "Could not parse the file" });
    } finally {
      setImportBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleGoogle() {
    if (importBusy) return;
    if (!isGoogleImportConfigured()) {
      toast.fail({ title: "Google Sheets import is not configured" });
      return;
    }
    setImportBusy(true);
    try {
      const picked = await openSpreadsheetPicker();
      const token = await getDriveFileToken();
      const titles = await listSheetTitles(picked.id, token);
      if (titles.length === 1) {
        const values = await readSheetValues(picked.id, titles[0]!, token);
        applyValues(values);
        return;
      }
      setPendingSheets({ id: picked.id, name: picked.name, titles });
    } catch (error) {
      if (isGoogleAuthCancelled(error) || isGooglePickerCancelled(error)) return;
      toast.fail({
        title: error instanceof Error ? error.message : "Could not read Google Sheet",
      });
    } finally {
      setImportBusy(false);
    }
  }

  async function handleSheetTitle(title: string) {
    if (!pendingSheets || importBusy) return;
    setImportBusy(true);
    try {
      const token = await getDriveFileToken();
      const values = await readSheetValues(pendingSheets.id, title, token);
      setPendingSheets(null);
      applyValues(values);
    } catch (error) {
      toast.fail({
        title: error instanceof Error ? error.message : "Could not read Google Sheet",
      });
    } finally {
      setImportBusy(false);
    }
  }

  function handleImportSelect(source: ImportCsvSource) {
    if (source === "file") {
      fileInputRef.current?.click();
      return;
    }
    void handleGoogle();
  }

  return (
    <div className="flex min-h-[360px] flex-1 flex-col items-center justify-center px-4 py-16">
      <p className="font-montserrat text-base font-semibold text-black">Import or Add</p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <Button
          variant={BUTTON_VARIANT.Normal}
          className="h-10 w-full rounded-[10px] border-black/10 px-4 text-sm text-black sm:w-auto sm:min-w-[193px]"
          onClick={() => downloadImportCsvTemplate(IMPORT_CSV_TEMPLATE, CATEGORY_IMPORT_CSV_TEMPLATE_FILENAME)}
        >
          <IconDownload className="size-3.5 shrink-0" />
          Download Template
        </Button>
        <div ref={importWrapRef} className="relative w-full sm:w-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept={IMPORT_CSV_ACCEPT}
            className="hidden"
            onChange={(event) => void handleCsvFile(event.target.files?.[0])}
          />
          <Button
            className="h-10 w-full rounded-[10px] px-4 text-sm sm:w-auto sm:min-w-[167px]"
            aria-expanded={importOpen}
            aria-haspopup="menu"
            disabled={importBusy}
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
            onSelect={handleImportSelect}
          />
        </div>
        <span className="hidden font-montserrat text-sm font-medium text-black sm:inline">
          or
        </span>
        <Button
          className="h-10 w-full rounded-[10px] px-4 text-sm sm:w-auto sm:min-w-[156px]"
          disabled={importBusy}
        >
          <IconPlus className="size-3 shrink-0" />
          Add Payment
        </Button>
      </div>
      <SelectSheetDialog
        open={pendingSheets !== null}
        spreadsheetName={pendingSheets?.name ?? ""}
        titles={pendingSheets?.titles ?? []}
        busy={importBusy}
        onClose={() => setPendingSheets(null)}
        onSelect={(title) => void handleSheetTitle(title)}
      />
    </div>
  );
}
