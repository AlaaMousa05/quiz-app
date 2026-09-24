import { postForm } from "../../../lib/apiClient";
import type { ImportConfirmResult, ImportPreview } from "./types";

export type ImportTarget = "students" | "teachers";

export function previewImportFile(target: ImportTarget, file: File): Promise<ImportPreview> {
  const form = new FormData();
  form.append("file", file);
  return postForm<ImportPreview>(`/imports/${target}/preview`, form);
}

export function confirmImportFile(target: ImportTarget, file: File): Promise<ImportConfirmResult> {
  const form = new FormData();
  form.append("file", file);
  return postForm<ImportConfirmResult>(`/imports/${target}/confirm`, form);
}
