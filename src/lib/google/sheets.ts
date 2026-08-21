import { SHEETS_API_BASE } from "./config";
import { getDriveFileToken } from "./token-client";

interface SpreadsheetMeta {
  sheets?: Array<{ properties?: { title?: string } }>;
}

interface ValueRange {
  values?: string[][];
}

function encodeSheetRange(title: string): string {
  const escaped = title.replace(/'/g, "''");
  return `'${escaped}'`;
}

async function sheetsGet<T>(path: string, accessToken: string): Promise<T> {
  const url = `${SHEETS_API_BASE}${path}`;
  const send = (token: string) => fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  let token = accessToken;
  let response = await send(token);
  if (response.status === 401) {
    token = await getDriveFileToken({ interactive: false });
    response = await send(token);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `Sheets request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function listSheetTitles(spreadsheetId: string, accessToken: string): Promise<string[]> {
  const data = await sheetsGet<SpreadsheetMeta>(
    `/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties.title`,
    accessToken,
  );
  const titles = (data.sheets ?? [])
    .map((sheet) => sheet.properties?.title?.trim() ?? "")
    .filter(Boolean);
  if (titles.length === 0) {
    throw new Error("This spreadsheet has no sheets");
  }
  return titles;
}

export async function readSheetValues(
  spreadsheetId: string,
  sheetTitle: string,
  accessToken: string,
): Promise<string[][]> {
  const range = encodeURIComponent(encodeSheetRange(sheetTitle));
  const data = await sheetsGet<ValueRange>(
    `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}`,
    accessToken,
  );
  return (data.values ?? []).map((row) => row.map((cell) => String(cell ?? "").trim()));
}
