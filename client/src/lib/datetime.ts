import type { Language } from "./i18n/I18nProvider";

const AMMAN_TIME_ZONE = "Asia/Amman";

// Numerals always render as Western/Latin digits, in both languages (FR-036,
// ui.md §1.9) — `numberingSystem: "latn"` overrides what an "ar" locale would
// otherwise pick (Eastern Arabic-Indic digits).
export function formatDateTime(iso: string, lang: Language): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en-US", {
    timeZone: AMMAN_TIME_ZONE,
    numberingSystem: "latn",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatTimer(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
