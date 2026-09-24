import { useTranslation } from "../../../lib/i18n/useTranslation";
import { AppShell } from "../../../components/ui/AppShell";
import { Card } from "../../../components/ui/Card";
import { LinkButton } from "../../../components/ui/LinkButton";

export function AdminHomePage() {
  const { t } = useTranslation();
  return (
    <AppShell title={t("role.admin.home")}>
      <Card>
        <p className="mb-3 text-sm text-neutral-500" dir="auto">
          {t("admin.dashboard.shortcuts")}
        </p>
        <div className="flex flex-wrap gap-2">
          <LinkButton variant="primary" to="/admin/classes">
            {t("admin.classes.title")}
          </LinkButton>
          <LinkButton variant="primary" to="/admin/users">
            {t("admin.users.title")}
          </LinkButton>
          <LinkButton to="/admin/quizzes">{t("admin.allQuizzes")}</LinkButton>
          <LinkButton to="/admin/results">{t("admin.allResults")}</LinkButton>
        </div>
      </Card>
    </AppShell>
  );
}
