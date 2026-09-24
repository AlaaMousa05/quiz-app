import { useTranslation } from "../../../lib/i18n/useTranslation";
import { RoleHomeShell } from "../../../components/ui/RoleHomeShell";
import { LinkButton } from "../../../components/ui/LinkButton";

export function AdminHomePage() {
  const { t } = useTranslation();
  return (
    <RoleHomeShell titleKey="role.admin.home">
      <div className="flex flex-wrap gap-2">
        <LinkButton to="/admin/classes">{t("admin.classes.title")}</LinkButton>
        <LinkButton to="/admin/users">{t("admin.users.title")}</LinkButton>
        <LinkButton to="/admin/quizzes">{t("admin.allQuizzes")}</LinkButton>
        <LinkButton to="/admin/results">{t("admin.allResults")}</LinkButton>
      </div>
    </RoleHomeShell>
  );
}
