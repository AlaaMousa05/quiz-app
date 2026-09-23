import { Component, type ReactNode } from "react";

// A class component is the only way to catch render-time errors in React
// (e.g. useMe's throwOnError rethrowing a non-401 API failure) — there is no
// hook equivalent, so this can't read i18n context and falls back to
// document.documentElement.lang (set by I18nProvider) instead.
const FALLBACK_MESSAGE: Record<string, string> = {
  en: "Something went wrong. Please reload the page.",
  ar: "حدث خطأ ما. يرجى إعادة تحميل الصفحة.",
};

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      const lang = document.documentElement.lang === "ar" ? "ar" : "en";
      return (
        <main className="flex min-h-screen items-center justify-center p-4">
          <p dir="auto">{FALLBACK_MESSAGE[lang]}</p>
        </main>
      );
    }
    return this.props.children;
  }
}
