import type { TranslationKey } from "shared";
import type { I18nContextValue } from "./i18n/I18nProvider";
import { ApiError } from "./apiClient";

// These messageKeys map to a deliberately-written, bilingual copy (login
// errors, the import-encoding rejection) — prefer their translation. Every
// other domain error's messageKey is a generic status bucket (error.conflict,
// error.validation, ...) whose translated text is vague ("That can't be done
// right now."); for those, the server's own `message` is the actual,
// specific reason (e.g. "Class has students or quizzes and cannot be
// deleted") and is far more useful than the bucket text, so we show it
// instead — see CLAUDE.md UI-pass instruction: never silently swallow or
// water down a failed action's real reason.
const GENERIC_KEYS = new Set<string>([
  "error.unauthorized",
  "error.forbidden",
  "error.notFound",
  "error.validation",
  "error.conflict",
  "error.deadlinePassed",
  "error.attemptFinalized",
  "error.quizLocked",
  "error.generic",
]);

export function errorMessage(t: I18nContextValue["t"], error: unknown, fallbackKey: TranslationKey = "error.generic"): string {
  if (error instanceof ApiError) {
    if (error.messageKey && !GENERIC_KEYS.has(error.messageKey)) {
      return t(error.messageKey as TranslationKey);
    }
    return error.message || t(fallbackKey);
  }
  return t(fallbackKey);
}
