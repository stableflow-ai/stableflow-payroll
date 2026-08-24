import { useRef, useState } from "react";
import { IconCloud } from "@/components/icons/cloud";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import { isGoogleImportConfigured } from "@/lib/google/config";
import { isGooglePickerCancelled, openSpreadsheetPicker } from "@/lib/google/picker";
import { listSheetTitles, readSheetValues } from "@/lib/google/sheets";
import { isGoogleAuthCancelled, getDriveFileToken } from "@/lib/google/token-client";
import { parseCsvFile } from "@/lib/import/csv";
import { cn } from "@/lib/utils";
import {
  IMPORT_CSV_ACCEPT,
  IMPORT_CSV_TEMPLATE,
  IMPORT_CSV_TEMPLATE_FILENAME,
} from "../../config";
import { SelectSheetDialog } from "./SelectSheetDialog";

export function BatchUploadStep(props: {
  onEnterManually: () => void;
  onImported: (values: string[][], defaultMemo: string) => void;
  onError: (message: string) => void;
}) {
  const { onEnterManually, onImported, onError } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busySource, setBusySource] = useState<"google" | "csv" | null>(null);
  const [pendingSheets, setPendingSheets] = useState<{
    id: string;
    name: string;
    titles: string[];
  } | null>(null);

  function downloadTemplate() {
    const blob = new Blob([IMPORT_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = IMPORT_CSV_TEMPLATE_FILENAME;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleCsvFile(file: File | undefined) {
    if (!file || busySource === "google") return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".csv") && file.type !== "text/csv") {
      onError("Please upload a CSV file");
      return;
    }
    setBusySource("csv");
    try {
      const values = await parseCsvFile(file);
      onImported(values, file.name);
    } catch {
      onError("Could not parse the file");
    } finally {
      setBusySource(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleGoogle() {
    if (busySource === "csv") return;
    if (!isGoogleImportConfigured()) {
      onError("Google Sheets import is not configured");
      return;
    }
    setBusySource("google");
    try {
      const picked = await openSpreadsheetPicker();
      const token = await getDriveFileToken();
      const titles = await listSheetTitles(picked.id, token);
      if (titles.length === 1) {
        const values = await readSheetValues(picked.id, titles[0]!, token);
        onImported(values, `${picked.name} · ${titles[0]}`);
        return;
      }
      setPendingSheets({ id: picked.id, name: picked.name, titles });
    } catch (error) {
      if (isGoogleAuthCancelled(error) || isGooglePickerCancelled(error)) return;
      onError(error instanceof Error ? error.message : "Could not read Google Sheet");
    } finally {
      setBusySource(null);
    }
  }

  async function handleSheetTitle(title: string) {
    if (!pendingSheets) return;
    setBusySource("google");
    try {
      const token = await getDriveFileToken();
      const values = await readSheetValues(pendingSheets.id, title, token);
      const memo = `${pendingSheets.name} · ${title}`;
      setPendingSheets(null);
      onImported(values, memo);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not read Google Sheet");
    } finally {
      setBusySource(null);
    }
  }

  return (
    <>
      <Card
        className={cn(
          "relative w-full px-5 py-6 sm:px-8 sm:py-8",
          dragOver ? "ring-2 ring-black/20" : "",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          if (busySource !== "google") setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          void handleCsvFile(event.dataTransfer.files[0]);
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-montserrat text-base font-semibold text-black sm:text-lg">
              Upload a CSV File
            </h2>
            <p className="mt-2 font-montserrat text-sm text-[#606060]">Privately execute payments from your organization's treasury.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="normal" size="md" onClick={onEnterManually}>
              Enter Manually
            </Button>
            <Button variant="normal" size="md" onClick={downloadTemplate}>
              Download Template
            </Button>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 py-8 sm:mt-16 sm:py-14">
          <IconCloud className="size-10 text-[#c4c4c4] sm:h-[26px] sm:w-8" />
          <p className="font-montserrat text-base font-semibold text-black">Drop CSV file here</p>
          <Button
            size="md"
            className="w-[152px]"
            loading={busySource === "csv"}
            disabled={busySource === "google"}
            onClick={() => inputRef.current?.click()}
          >
            Choose file
          </Button>
          <button
            type="button"
            disabled={busySource === "csv" || busySource === "google"}
            onClick={() => void handleGoogle()}
            className="inline-flex h-10 w-[152px] items-center justify-center rounded-[10px] border border-[#d9d9d9] bg-white shadow-[0_0_6px_0_rgba(0,0,0,0.06)] disabled:opacity-40"
          >
            {busySource === "google" && !pendingSheets ? (
              <span className="size-4 animate-spin rounded-full border-2 border-black border-r-transparent" />
            ) : (
              <img src="/pay/google-sheets.png" alt="Google Sheets" className="h-4 w-[109px] object-contain" />
            )}
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={IMPORT_CSV_ACCEPT}
          hidden
          onChange={(event) => void handleCsvFile(event.target.files?.[0])}
        />
      </Card>

      <SelectSheetDialog
        open={Boolean(pendingSheets)}
        spreadsheetName={pendingSheets?.name ?? ""}
        titles={pendingSheets?.titles ?? []}
        busy={busySource === "google"}
        onClose={() => setPendingSheets(null)}
        onSelect={(title) => void handleSheetTitle(title)}
      />
    </>
  );
}
