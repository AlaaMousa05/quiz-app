import { useTranslation } from "../../lib/i18n/useTranslation";
import { Button } from "./Button";

export function LanguageToggle() {
  const { lang, setLang, t } = useTranslation();

  return (
    <Button onClick={() => setLang(lang === "en" ? "ar" : "en")} dir="auto">
      {t("language.toggle")}
    </Button>
  );
}
