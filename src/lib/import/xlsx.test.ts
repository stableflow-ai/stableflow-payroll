import { describe, expect, it } from "vitest";
import { FIXED_CHAINS } from "@/config/chains";
import { PAYOUT_SYMBOLS } from "@/stores/intents-tokens";
import type { DataValidation, Worksheet } from "exceljs";
import { parseCsvString } from "./csv";
import {
  IMPORT_LISTS_SHEET,
  IMPORT_TEMPLATE_MAX_ROWS,
  IMPORT_TEMPLATE_SHEET,
  IMPORT_XLSX_MIME,
} from "./config";
import {
  buildImportTemplateWorkbook,
  isImportSpreadsheetFile,
  parseImportFile,
  parseXlsxFile,
  workbookToXlsxBlob,
} from "./xlsx";

const PAYROLL_CSV = [
  "recipient,email,amount,token,network,memo",
  "0x557be3f47a45499385f60cd64e2ff455e42a3311,alice@example.com,100,USDC,eth,payroll",
  "stableflow.near,bob@example.com,50,USDT,near,",
].join("\n");

type SheetValidations = Worksheet & {
  dataValidations: { model: Record<string, DataValidation> };
};

function validationModel(sheet: Worksheet | undefined): Record<string, DataValidation> {
  if (!sheet) return {};
  return (sheet as SheetValidations).dataValidations.model;
}

describe("buildImportTemplateWorkbook", () => {
  it("hides Lists and adds token/network dropdowns", async () => {
    const rows = parseCsvString(PAYROLL_CSV);
    const workbook = await buildImportTemplateWorkbook(rows);
    const lists = workbook.getWorksheet(IMPORT_LISTS_SHEET);
    const sheet = workbook.getWorksheet(IMPORT_TEMPLATE_SHEET);

    expect(lists?.state).toBe("hidden");
    expect(PAYOUT_SYMBOLS.map((_, index) => lists?.getCell(index + 1, 1).value)).toEqual([...PAYOUT_SYMBOLS]);
    expect(FIXED_CHAINS.map((chain, index) => lists?.getCell(index + 1, 2).value)).toEqual(
      FIXED_CHAINS.map((chain) => chain.blockchain),
    );

    const model = validationModel(sheet);
    const token = model[`D2:D${IMPORT_TEMPLATE_MAX_ROWS + 1}`];
    const network = model[`E2:E${IMPORT_TEMPLATE_MAX_ROWS + 1}`];
    expect(token?.type).toBe("list");
    expect(token?.allowBlank).toBe(true);
    expect(String(token?.formulae[0])).toBe(`Lists!$A$1:$A$${PAYOUT_SYMBOLS.length}`);
    expect(network?.type).toBe("list");
    expect(String(network?.formulae[0])).toBe(`Lists!$B$1:$B$${FIXED_CHAINS.length}`);
  });

  it("places expense dropdowns on the token and network columns", async () => {
    const rows = parseCsvString(
      "name,recipient,email,amount,token,network,purpose,description\nAndrew,0x1,a@b.com,800,USDC,eth,Travel,",
    );
    const workbook = await buildImportTemplateWorkbook(rows);
    const model = validationModel(workbook.getWorksheet(IMPORT_TEMPLATE_SHEET));
    expect(model[`E2:E${IMPORT_TEMPLATE_MAX_ROWS + 1}`]?.type).toBe("list");
    expect(model[`F2:F${IMPORT_TEMPLATE_MAX_ROWS + 1}`]?.type).toBe("list");
  });
});

describe("parseXlsxFile", () => {
  it("round-trips example rows and skips the hidden Lists sheet", async () => {
    const rows = parseCsvString(PAYROLL_CSV);
    const workbook = await buildImportTemplateWorkbook(rows);
    const blob = await workbookToXlsxBlob(workbook);
    const file = new File([blob], "payroll-import-template.xlsx", { type: IMPORT_XLSX_MIME });
    const parsed = await parseXlsxFile(file);
    expect(parsed[0]?.[0]).toBe("recipient");
    expect(parsed).toEqual(rows);
  });
});

describe("parseImportFile", () => {
  it("parses csv by extension", async () => {
    const file = new File([PAYROLL_CSV], "rows.csv", { type: "text/csv" });
    await expect(parseImportFile(file)).resolves.toEqual(parseCsvString(PAYROLL_CSV));
  });

  it("parses xlsx by extension", async () => {
    const rows = parseCsvString(PAYROLL_CSV);
    const workbook = await buildImportTemplateWorkbook(rows);
    const blob = await workbookToXlsxBlob(workbook);
    const file = new File([blob], "rows.xlsx", { type: IMPORT_XLSX_MIME });
    await expect(parseImportFile(file)).resolves.toEqual(rows);
  });
});

describe("isImportSpreadsheetFile", () => {
  it("accepts csv and xlsx names or mime types", () => {
    expect(isImportSpreadsheetFile(new File([""], "a.csv"))).toBe(true);
    expect(isImportSpreadsheetFile(new File([""], "a.xlsx"))).toBe(true);
    expect(isImportSpreadsheetFile(new File([""], "a.bin", { type: "text/csv" }))).toBe(true);
    expect(isImportSpreadsheetFile(new File([""], "a.bin", { type: IMPORT_XLSX_MIME }))).toBe(true);
    expect(isImportSpreadsheetFile(new File([""], "a.txt"))).toBe(false);
  });
});
