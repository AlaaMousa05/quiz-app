import type { QuizImportPreview } from "shared";
import { ApiError } from "../../../lib/apiClient";
import type { QuizSettingsFormInput } from "./types";

// Multipart requests bypass apiClient's JSON-only wrapper — fetch must set
// its own multipart boundary in Content-Type, which it only does when no
// Content-Type header is set explicitly.
async function postForm<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`/api${path}`, { method: "POST", credentials: "include", body: form });
  const body: unknown = await res.json().catch(() => undefined);
  if (!res.ok) {
    const messageKey = (body as { messageKey?: string } | undefined)?.messageKey;
    const message = (body as { message?: string } | undefined)?.message ?? res.statusText;
    throw new ApiError(message, res.status, messageKey);
  }
  return body as T;
}

export function previewQuizImportFile(file: File): Promise<QuizImportPreview> {
  const form = new FormData();
  form.append("file", file);
  return postForm<QuizImportPreview>("/imports/quiz/preview", form);
}

export function confirmQuizImportFile(file: File, settings: QuizSettingsFormInput): Promise<{ quizId: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("classIds", JSON.stringify(settings.classIds));
  form.append("opensAt", settings.opensAt);
  form.append("closesAt", settings.closesAt);
  form.append("timeLimitMinutes", String(settings.timeLimitMinutes ?? 20));
  form.append("negMarkEnabled", String(settings.negMarkEnabled ?? false));
  if (settings.negMarkPenalty !== undefined) {
    form.append("negMarkPenalty", String(settings.negMarkPenalty));
  }
  return postForm<{ quizId: string }>("/imports/quiz/confirm", form);
}
