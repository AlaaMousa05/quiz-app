import type { ReactNode } from "react";
import type { TranslationKey } from "shared";
import type { I18nContextValue } from "../../lib/i18n/I18nProvider";
import { CenteredMessage } from "./CenteredMessage";

// The loading/error two-branch guard every data-fetching page repeats before
// its real content. A plain function, not a hook (it calls no hooks of its
// own — the caller passes its own `t`), so a hook returning JSX doesn't sit
// oddly between this project's hooks/ (logic, no JSX) and components/
// (JSX) layering. Returns the message to render, or null once it's safe to
// render the page's own content — an early `return` on a non-null result
// keeps normal TS narrowing on whatever query data the caller reads next.
export function queryGateMessage(t: I18nContextValue["t"], isLoading: boolean, isError: boolean, errorKey: TranslationKey): ReactNode | null {
  if (isLoading) return <CenteredMessage>{t("common.loading")}</CenteredMessage>;
  if (isError) return <CenteredMessage>{t(errorKey)}</CenteredMessage>;
  return null;
}
