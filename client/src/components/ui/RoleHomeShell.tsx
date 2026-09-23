import type { TranslationKey } from "shared";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { useLogout } from "../../features/auth/api/useLogout";
import { LanguageToggle } from "./LanguageToggle";
import { Button } from "./Button";

export function RoleHomeShell({ titleKey }: { titleKey: TranslationKey }) {
  const { t } = useTranslation();
  const logout = useLogout();

  return (
    <main className="flex min-h-screen flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" dir="auto">
          {t(titleKey)}
        </h1>
        <div className="flex gap-2">
          <LanguageToggle />
          <Button onClick={() => logout.mutate()}>{t("nav.logout")}</Button>
        </div>
      </div>
    </main>
  );
}
