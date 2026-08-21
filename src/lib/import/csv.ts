import Papa from "papaparse";

function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function looksLikeMarkdownPipeTable(text: string): boolean {
  const lines = stripBom(text).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return false;
  const piped = lines.filter((line) => line.includes("|"));
  return piped.length >= Math.ceil(lines.length * 0.8);
}

export function parseMarkdownPipeTable(text: string): string[][] | null {
  if (!looksLikeMarkdownPipeTable(text)) return null;
  const rows: string[][] = [];
  for (const line of stripBom(text).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes("|")) continue;
    const cells = trimmed.replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
    if (isSeparatorRow(cells)) continue;
    if (cells.every((cell) => cell === "")) continue;
    rows.push(cells);
  }
  return rows.length > 0 ? rows : null;
}

function normalizeParsedRows(data: string[][]): string[][] {
  return data
    .map((row) => row.map((cell) => String(cell ?? "").trim()))
    .filter((row) => row.some((cell) => cell !== ""));
}

export function parseCsvString(text: string): string[][] {
  const result = Papa.parse<string[]>(stripBom(text), {
    header: false,
    skipEmptyLines: "greedy",
    transform: (value) => value.trim(),
  });
  return normalizeParsedRows(result.data ?? []);
}

export function parseTabularText(text: string): string[][] {
  return parseMarkdownPipeTable(text) ?? parseCsvString(text);
}

function parseCsvFileWithPapa(file: File, worker: boolean): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: "greedy",
      worker,
      transform: (value) => value.trim(),
      complete: (result) => resolve(normalizeParsedRows(result.data ?? [])),
      error: (error) => reject(error),
    });
  });
}

export async function parseCsvFile(file: File): Promise<string[][]> {
  const text = await file.text();
  const markdown = parseMarkdownPipeTable(text);
  if (markdown) return markdown;
  try {
    return await parseCsvFileWithPapa(file, true);
  } catch {
    return parseCsvString(text);
  }
}
