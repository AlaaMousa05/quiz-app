import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en, ar, type TranslationKey } from "shared";

export type Language = "en" | "ar";

const STORAGE_KEY = "quizapp.language";
const dictionaries: Record<Language, Record<TranslationKey, string>> = { en, ar };

function detectInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "ar") {
    return stored;
  }
  return navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en";
}

export interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), template);
}

export const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang: (next) => {
        localStorage.setItem(STORAGE_KEY, next);
        setLangState(next);
      },
      t: (key, params) => interpolate(dictionaries[lang][key], params),
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
