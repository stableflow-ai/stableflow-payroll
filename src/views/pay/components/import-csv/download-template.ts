import { downloadCsvFile } from "@/lib/import/csv";
import { stampDownloadFilename } from "@/views/pay/utils";

export function downloadImportCsvTemplate(content: string, filename: string): void {
  downloadCsvFile(content, stampDownloadFilename(filename));
}
