import ExcelJS from "exceljs";
import { parse as parseCsvSync } from "csv-parse/sync";
import { ValidationError } from "../errors/index.js";

// Shared by every spreadsheet import (quiz/students/teachers) — the file
// format and encoding rules (FR-019/019a) are identical across all three;
// only the column layout differs, which each caller parses itself from the
// raw row arrays this returns.

function stripBom(buffer: Buffer): Buffer {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3);
  }
  return buffer;
}

// A strict decode is exactly the boundary FR-019a needs (accept UTF-8
// with/without BOM, reject everything else, including Windows-1256) without
// an encoding-*detection* library, which would be guessing (research.md).
function decodeUtf8Strict(buffer: Buffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(stripBom(buffer));
  } catch {
    throw new ValidationError("Save as CSV UTF-8 or upload XLSX", "import.invalidEncoding");
  }
}

function isXlsx(filename: string): boolean {
  return filename.toLowerCase().endsWith(".xlsx");
}

function isCsv(filename: string): boolean {
  return filename.toLowerCase().endsWith(".csv");
}

async function readXlsxRows(fileBuffer: Buffer): Promise<string[][]> {
  const workbook = new ExcelJS.Workbook();
  // exceljs's bundled type declares `load(buffer: Buffer)` against a
  // slightly different structural Buffer shape than this project's
  // @types/node version produces — the values are identical at runtime.
  await workbook.xlsx.load(fileBuffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  const rows: string[][] = [];
  workbook.worksheets[0]?.eachRow((row) => {
    const values = row.values as unknown[]; // 1-indexed; values[0] is always undefined
    rows.push(values.slice(1).map((v) => (v === null || v === undefined ? "" : String(v))));
  });
  return rows;
}

function readCsvRows(fileBuffer: Buffer): string[][] {
  const text = decodeUtf8Strict(fileBuffer);
  return parseCsvSync(text, { skip_empty_lines: true }) as string[][];
}

// Returns every row including the header row (index 0) — callers slice it
// off themselves since the header's column count is also how they validate
// the file matches their expected layout.
export async function readSpreadsheetRows(fileBuffer: Buffer, filename: string): Promise<string[][]> {
  if (isXlsx(filename)) {
    return readXlsxRows(fileBuffer);
  }
  if (isCsv(filename)) {
    return readCsvRows(fileBuffer);
  }
  throw new ValidationError("Save as CSV UTF-8 or upload XLSX", "import.invalidEncoding");
}
