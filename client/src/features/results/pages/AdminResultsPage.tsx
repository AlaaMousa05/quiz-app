import { useTranslation } from "../../../lib/i18n/useTranslation";
import { RoleHomeShell } from "../../../components/ui/RoleHomeShell";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { queryGateMessage } from "../../../components/ui/queryGateMessage";
import { Card } from "../../../components/ui/Card";
import { LinkButton } from "../../../components/ui/LinkButton";
import { useAdminQuizzes } from "../api/useAdminQuizzes";
import type { AdminQuizListItem } from "../api/types";

function groupByClass(quizzes: AdminQuizListItem[]): Map<string, AdminQuizListItem[]> {
  const groups = new Map<string, AdminQuizListItem[]>();
  for (const quiz of quizzes) {
    for (const className of quiz.classNames.length > 0 ? quiz.classNames : ["—"]) {
      const existing = groups.get(className) ?? [];
      existing.push(quiz);
      groups.set(className, existing);
    }
  }
  return groups;
}

export function AdminResultsPage() {
  const { t } = useTranslation();
  const { data: quizzes, isLoading, isError } = useAdminQuizzes();

  const gate = queryGateMessage(t, isLoading, isError, "admin.loadError");
  const groups = quizzes ? groupByClass(quizzes) : null;

  return (
    <RoleHomeShell titleKey="app.title">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <h2 className="text-2xl font-semibold" dir="auto">
          {t("admin.allResults")}
        </h2>
        {gate}
        {!gate && groups && groups.size === 0 && <CenteredMessage>{t("results.empty")}</CenteredMessage>}
        {!gate &&
          groups &&
          Array.from(groups.entries()).map(([className, classQuizzes]) => (
            <div key={className} className="flex flex-col gap-2">
              <h3 className="font-medium" dir="auto">
                {className}
              </h3>
              {classQuizzes.map((quiz) => (
                <Card key={quiz.id} className="flex items-center justify-between gap-2">
                  <p dir="auto">
                    {quiz.title} ({t("admin.owner", { name: quiz.ownerName })})
                  </p>
                  <LinkButton to={`/admin/quizzes/${quiz.id}/results`}>{t("admin.viewResults")}</LinkButton>
                </Card>
              ))}
            </div>
          ))}
      </div>
    </RoleHomeShell>
  );
}
