import bcrypt from "bcrypt";
import { normalizeArabicName } from "shared";
import { readSpreadsheetRows } from "./spreadsheetReader.js";
import { generateStudentUsername, generateTeacherUsername, generateTemporaryPassword } from "./credentials.service.js";
import { createImportBatch } from "../repositories/importBatch.repository.js";
import { createClass, findClassByName, listAllClassNames } from "../repositories/class.repository.js";
import { createUser, findByUsername, findDuplicateStudent, findDuplicateTeacher } from "../repositories/user.repository.js";

type RowStatus = "OK" | "OK_NEW_CLASS" | "DUPLICATE_SKIPPED" | "ERROR";

export interface ImportRow {
  rowNumber: number;
  name: string;
  className?: string;
  studentId?: string;
  status: RowStatus;
  error?: string;
}

export interface ImportPreview {
  rows: ImportRow[];
  summary: { total: number; willImport: number; newClasses: string[] };
}

export interface CreatedAccount {
  userId: string;
  username: string;
  name: string;
  temporaryPassword: string;
}

function isImportable(status: RowStatus): boolean {
  return status === "OK" || status === "OK_NEW_CLASS";
}

// --- Students (Name, Class, StudentId?) — FR-016, FR-020, FR-020a ---

export async function previewStudentsImport(fileBuffer: Buffer, filename: string): Promise<ImportPreview> {
  const rawRows = await readSpreadsheetRows(fileBuffer, filename);
  const existingClassNames = new Set((await listAllClassNames()).map((c) => c.name));
  const newClassNames = new Set<string>();

  const rows: ImportRow[] = [];
  const dataRows = rawRows.slice(1);
  for (let i = 0; i < dataRows.length; i++) {
    const [name = "", className = "", studentId = ""] = dataRows[i]!;
    const rowNumber = i + 1;
    if (!name.trim()) {
      rows.push({ rowNumber, name: "", className, status: "ERROR", error: "Missing name" });
      continue;
    }
    if (!className.trim()) {
      rows.push({ rowNumber, name, className: "", status: "ERROR", error: "Missing class" });
      continue;
    }

    // eslint-disable-next-line no-await-in-loop -- per-row DB check, files are small (~20-60 rows)
    const duplicate = await findDuplicateStudent(normalizeArabicName(name), className.trim());
    if (duplicate) {
      rows.push({ rowNumber, name, className, studentId: studentId.trim() || undefined, status: "DUPLICATE_SKIPPED" });
      continue;
    }

    const isNewClass = !existingClassNames.has(className.trim());
    if (isNewClass) newClassNames.add(className.trim());
    rows.push({
      rowNumber,
      name: name.trim(),
      className: className.trim(),
      studentId: studentId.trim() || undefined,
      status: isNewClass ? "OK_NEW_CLASS" : "OK",
    });
  }

  const willImport = rows.filter((r) => isImportable(r.status)).length;
  return { rows, summary: { total: rows.length, willImport, newClasses: Array.from(newClassNames) } };
}

export async function confirmStudentsImport(fileBuffer: Buffer, filename: string, uploadedByUserId: string) {
  const preview = await previewStudentsImport(fileBuffer, filename);
  const importableRows = preview.rows.filter((r) => isImportable(r.status));
  const created: CreatedAccount[] = [];
  const classIdByName = new Map<string, string>();

  for (const row of importableRows) {
    const className = row.className!;
    // eslint-disable-next-line no-await-in-loop -- sequential so repeated class names in one file reuse the first-created row
    let classId = classIdByName.get(className) ?? (await findClassByName(className))?.id;
    if (!classId) {
      // eslint-disable-next-line no-await-in-loop
      const newClass = await createClass(className);
      classId = newClass.id;
    }
    classIdByName.set(className, classId);

    // eslint-disable-next-line no-await-in-loop -- a provided studentId must be checked for uniqueness before reuse
    const username = row.studentId && !(await findByUsername(row.studentId)) ? row.studentId : await generateStudentUsername(className);
    const temporaryPassword = generateTemporaryPassword();
    // eslint-disable-next-line no-await-in-loop
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    // eslint-disable-next-line no-await-in-loop
    const user = await createUser({ role: "STUDENT", name: row.name, username, passwordHash, classId });
    created.push({ userId: user.id, username: user.username, name: user.name, temporaryPassword });
  }

  const batch = await createImportBatch({
    type: "STUDENTS",
    uploadedByUserId,
    fileName: filename,
    rowsTotal: preview.summary.total,
    rowsCreated: created.length,
    rowsSkippedDuplicate: preview.rows.filter((r) => r.status === "DUPLICATE_SKIPPED").length,
    rowsFailed: preview.rows.filter((r) => r.status === "ERROR").length,
  });

  return { importBatchId: batch.id, created };
}

// --- Teachers (Name only) — FR-017, FR-020 ---

export async function previewTeachersImport(fileBuffer: Buffer, filename: string): Promise<ImportPreview> {
  const rawRows = await readSpreadsheetRows(fileBuffer, filename);
  const dataRows = rawRows.slice(1);

  const rows: ImportRow[] = [];
  for (let i = 0; i < dataRows.length; i++) {
    const [name = ""] = dataRows[i]!;
    const rowNumber = i + 1;
    if (!name.trim()) {
      rows.push({ rowNumber, name: "", status: "ERROR", error: "Missing name" });
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    const duplicate = await findDuplicateTeacher(normalizeArabicName(name));
    rows.push(duplicate ? { rowNumber, name, status: "DUPLICATE_SKIPPED" } : { rowNumber, name: name.trim(), status: "OK" });
  }

  const willImport = rows.filter((r) => isImportable(r.status)).length;
  return { rows, summary: { total: rows.length, willImport, newClasses: [] } };
}

export async function confirmTeachersImport(fileBuffer: Buffer, filename: string, uploadedByUserId: string) {
  const preview = await previewTeachersImport(fileBuffer, filename);
  const importableRows = preview.rows.filter((r) => isImportable(r.status));
  const created: CreatedAccount[] = [];

  for (const row of importableRows) {
    const username = await generateTeacherUsername(row.name);
    const temporaryPassword = generateTemporaryPassword();
    // eslint-disable-next-line no-await-in-loop
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    // eslint-disable-next-line no-await-in-loop
    const user = await createUser({ role: "TEACHER", name: row.name, username, passwordHash });
    created.push({ userId: user.id, username: user.username, name: user.name, temporaryPassword });
  }

  const batch = await createImportBatch({
    type: "TEACHERS",
    uploadedByUserId,
    fileName: filename,
    rowsTotal: preview.summary.total,
    rowsCreated: created.length,
    rowsSkippedDuplicate: preview.rows.filter((r) => r.status === "DUPLICATE_SKIPPED").length,
    rowsFailed: preview.rows.filter((r) => r.status === "ERROR").length,
  });

  return { importBatchId: batch.id, created };
}
