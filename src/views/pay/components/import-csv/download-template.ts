import { parseCsvString } from "@/lib/import/csv";
import { downloadImportXlsxTemplate } from "@/lib/import/xlsx";
import { stampDownloadFilename } from "@/views/pay/utils";

function ensureXlsxFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".xlsx")) return filename;
  if (lower.endsWith(".csv")) return `${filename.slice(0, -4)}.xlsx`;
  return `${filename}.xlsx`;
}

export async function downloadImportCsvTemplate(content: string, filename: string): Promise<void> {
  const rows = parseCsvString(content);
  await downloadImportXlsxTemplate(rows, stampDownloadFilename(ensureXlsxFilename(filename)));
}
