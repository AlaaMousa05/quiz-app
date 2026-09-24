import type { QuizImportPreview } from "shared";
import { postForm } from "../../../lib/apiClient";
import type { QuizSettingsFormInput } from "./types";

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
