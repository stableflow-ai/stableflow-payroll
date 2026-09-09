import { useEffect, useRef, useState } from "react";
import { IconArrowDown } from "@/components/icons/arrow-down";
import { IconImportFile } from "@/components/icons/import-file";
import { Button, type ButtonProps } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import { useMediaQuery } from "@/hooks/use-media-query";
import useToast from "@/hooks/use-toast";
import { isGoogleImportConfigured } from "@/lib/google/config";
import { isGooglePickerCancelled, openSpreadsheetPicker } from "@/lib/google/picker";
import { listSheetTitles, readSheetValues } from "@/lib/google/sheets";
import { isGoogleAuthCancelled, getDriveFileToken } from "@/lib/google/token-client";
import { parseCsvFile } from "@/lib/import/csv";
import { cn } from "@/lib/utils";
import type { BonusPendingRow } from "@/types/bonus";
import { SelectSheetDialog } from "@/views/pay/components/batch/SelectSheetDialog";
import { BONUS_FORM_MAX_ROWS, IMPORT_CSV_ACCEPT } from "../../config";
import { parseBonusImportRows } from "../../utils";
import { ImportCsvMenu, type ImportCsvSource } from "@/views/pay/components/import-csv/ImportCsvMenu";

export function BonusImportCsvButton(props: {
  onImported: (rows: BonusPendingRow[]) => void;
  busy?: boolean;
  variant?: ButtonProps["variant"];
  className?: string;
  fullWidth?: boolean;
  menuAlign?: "start" | "end";
}) {
  const {
    onImported,
    busy = false,
    variant = BUTTON_VARIANT.Primary,
    className,
    fullWidth = true,
    menuAlign = "start",
  } = props;
  const toast = useToast();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [importOpen, setImportOpen] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const importWrapRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingSheets, setPendingSheets] = useState<{
    id: string;
    name: string;
    titles: string[];
  } | null>(null);

  const locked = busy || importBusy;

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
    const parsed = parseBonusImportRows(values, BONUS_FORM_MAX_ROWS);
    if (parsed.truncated) {
      toast.fail({ title: `Imported the first ${BONUS_FORM_MAX_ROWS} rows` });
    }
    if (parsed.rows.length === 0) {
      toast.fail({ title: "No rows found" });
      return;
    }
    onImported(parsed.rows);
  }

  async function handleCsvFile(file: File | undefined) {
    if (!file || locked) return;
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
    if (locked) return;
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
    if (!pendingSheets || locked) return;
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
    <div ref={importWrapRef} className={cn("relative", fullWidth ? "w-full sm:w-auto" : "w-auto")}>
      <input
        ref={fileInputRef}
        type="file"
        accept={IMPORT_CSV_ACCEPT}
        className="hidden"
        onChange={(event) => void handleCsvFile(event.target.files?.[0])}
      />
      <Button
        variant={variant}
        className={className}
        aria-expanded={importOpen}
        aria-haspopup="menu"
        disabled={locked}
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
        align={menuAlign}
        onClose={() => setImportOpen(false)}
        onSelect={handleImportSelect}
      />
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
