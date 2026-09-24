import { useTranslation } from "../../../lib/i18n/useTranslation";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { LinkButton } from "../../../components/ui/LinkButton";
import type { AdminClass } from "../api/types";

export function ClassCard({ klass }: { klass: AdminClass }) {
  const { t } = useTranslation();
  return (
    <Card className="flex items-center justify-between gap-2">
      <div>
        <p className="flex items-center gap-2 font-medium" dir="auto">
          {klass.name}
          {klass.status === "ARCHIVED" && <Badge>{t("admin.classes.archived")}</Badge>}
        </p>
        <p className="text-sm text-neutral-500" dir="auto">
          {t("admin.classes.studentsCount", { count: klass.studentCount })} ·{" "}
          {t("admin.classes.quizzesCount", { count: klass.quizCount })}
        </p>
      </div>
      <LinkButton to={`/admin/classes/${klass.id}`}>{t("admin.classes.open")}</LinkButton>
    </Card>
  );
}
