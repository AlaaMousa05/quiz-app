export interface AdminUser {
  id: string;
  name: string;
  username: string;
  role: "TEACHER" | "STUDENT" | "ADMIN";
  className?: string;
  status: "ACTIVE" | "DEACTIVATED";
}

export interface CreatedAccount {
  userId: string;
  username: string;
  name: string;
  temporaryPassword: string;
}

export type ImportRowStatus = "OK" | "OK_NEW_CLASS" | "DUPLICATE_SKIPPED" | "ERROR";

export interface ImportRow {
  rowNumber: number;
  name: string;
  className?: string;
  studentId?: string;
  status: ImportRowStatus;
  error?: string;
}

export interface ImportPreview {
  rows: ImportRow[];
  summary: { total: number; willImport: number; newClasses: string[] };
}

export interface ImportConfirmResult {
  importBatchId: string;
  created: CreatedAccount[];
}
