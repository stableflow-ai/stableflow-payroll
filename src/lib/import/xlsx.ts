import type { CellValue, DataValidation, Workbook, Worksheet } from "exceljs";
import { getRuntimeChains } from "@/config/chains";
import { getPayoutSymbols } from "@/stores/intents-tokens";
import { normalizeParsedRows, parseCsvFile } from "./csv";
import {
  IMPORT_LISTS_SHEET,
  IMPORT_NETWORK_HEADER,
  IMPORT_TEMPLATE_MAX_ROWS,
  IMPORT_TEMPLATE_SHEET,
  IMPORT_TOKEN_HEADER,
  IMPORT_XLSX_MIME,
} from "./config";

type WorksheetValidations = Worksheet & {
  dataValidations: {
    add: (range: string, validation: DataValidation) => void;
    find: (range: string) => DataValidation | undefined;
    model: Record<string, DataValidation>;
  };
};

async function loadWorkbookCtor(): Promise<new () => Workbook> {
  const exceljs = await import("exceljs");
  if (typeof exceljs.Workbook === "function") return exceljs.Workbook;
  const nested = (exceljs as { default?: { Workbook?: new () => Workbook } }).default?.Workbook;
  if (typeof nested === "function") return nested;
  throw new Error("Could not load ExcelJS");
}

export function isXlsxImportFile(file: File): boolean {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx")) return true;
  return file.type === IMPORT_XLSX_MIME;
}

export function isImportSpreadsheetFile(file: File): boolean {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".xlsx")) return true;
  const type = file.type.toLowerCase();
  return type === "text/csv" || type === "application/csv" || type === IMPORT_XLSX_MIME;
}

function columnLetter(index: number): string {
  let n = index;
  let letter = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

function headerColumnIndex(headers: string[], name: string): number {
  return headers.findIndex((header) => header.trim().toLowerCase() === name) + 1;
}

function cellText(value: CellValue): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "richText" in value) {
    return value.richText.map((part) => part.text).join("").trim();
  }
  if (typeof value === "object" && "text" in value) {
    return String(value.text ?? "").trim();
  }
  if (typeof value === "object" && "result" in value) {
    return cellText(value.result);
  }
  if (typeof value === "object" && "error" in value) {
    return String(value.error ?? "").trim();
  }
  return "";
}

function isHiddenSheet(sheet: Worksheet): boolean {
  return sheet.state === "hidden" || sheet.state === "veryHidden";
}

function firstVisibleSheet(workbook: Workbook): Worksheet | undefined {
  return workbook.worksheets.find((sheet) => !isHiddenSheet(sheet)) ?? workbook.worksheets[0];
}

function listFormula(columnLetterRef: string, count: number): string {
  return `${IMPORT_LISTS_SHEET}!$${columnLetterRef}$1:$${columnLetterRef}$${count}`;
}

function listValidation(formula: string, title: string, error: string): DataValidation {
  return {
    type: "list",
    allowBlank: true,
    formulae: [formula],
    showErrorMessage: true,
    errorStyle: "error",
    errorTitle: title,
    error,
  };
}

function addListValidation(sheet: Worksheet, col: number, formula: string, title: string, error: string): void {
  if (col <= 0) return;
  const letter = columnLetter(col);
  const range = `${letter}2:${letter}${IMPORT_TEMPLATE_MAX_ROWS + 1}`;
  (sheet as WorksheetValidations).dataValidations.add(range, listValidation(formula, title, error));
}

export async function buildImportTemplateWorkbook(rows: string[][]): Promise<Workbook> {
  const Workbook = await loadWorkbookCtor();
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet(IMPORT_TEMPLATE_SHEET);
  const lists = workbook.addWorksheet(IMPORT_LISTS_SHEET);
  lists.state = "hidden";

  const data = rows.length > 0 ? rows : [[IMPORT_TOKEN_HEADER, IMPORT_NETWORK_HEADER]];
  data.forEach((row) => {
    sheet.addRow(row);
  });
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const colCount = Math.max(...data.map((row) => row.length), 1);
  for (let col = 1; col <= colCount; col += 1) {
    const header = String(data[0]?.[col - 1] ?? "");
    sheet.getColumn(col).width = Math.max(12, Math.min(28, header.length + 4));
  }

  const payoutSymbols = getPayoutSymbols();
  const runtimeChains = getRuntimeChains();
  payoutSymbols.forEach((symbol, index) => {
    lists.getCell(index + 1, 1).value = symbol;
  });
  runtimeChains.forEach((chain, index) => {
    lists.getCell(index + 1, 2).value = chain.blockchain;
  });
  lists.getColumn(1).width = 12;
  lists.getColumn(2).width = 12;

  const headers = data[0] ?? [];
  addListValidation(
    sheet,
    headerColumnIndex(headers, IMPORT_TOKEN_HEADER),
    listFormula("A", payoutSymbols.length),
    "Invalid token",
    "Select a token from the list",
  );
  addListValidation(
    sheet,
    headerColumnIndex(headers, IMPORT_NETWORK_HEADER),
    listFormula("B", runtimeChains.length),
    "Invalid network",
    "Select a network from the list",
  );

  return workbook;
}

function sheetToRows(sheet: Worksheet): string[][] {
  const colCount = Math.max(sheet.columnCount, sheet.actualColumnCount, 1);
  const rows: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const width = Math.max(colCount, row.cellCount, 1);
    const cells: string[] = [];
    for (let col = 1; col <= width; col += 1) {
      cells.push(cellText(row.getCell(col).value));
    }
    rows.push(cells);
  });
  return normalizeParsedRows(rows);
}

export async function parseXlsxFile(file: File): Promise<string[][]> {
  const Workbook = await loadWorkbookCtor();
  const workbook = new Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);
  const sheet = firstVisibleSheet(workbook);
  if (!sheet) return [];
  return sheetToRows(sheet);
}

export async function parseImportFile(file: File): Promise<string[][]> {
  if (isXlsxImportFile(file)) return parseXlsxFile(file);
  return parseCsvFile(file);
}

export async function workbookToXlsxBlob(workbook: Workbook): Promise<Blob> {
  const buffer = await workbook.xlsx.writeBuffer();
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return new Blob([bytes], { type: IMPORT_XLSX_MIME });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadImportXlsxTemplate(rows: string[][], filename: string): Promise<void> {
  const workbook = await buildImportTemplateWorkbook(rows);
  const blob = await workbookToXlsxBlob(workbook);
  downloadBlob(blob, filename);
}
