import { useTranslation } from "../../../lib/i18n/useTranslation";
import { RoleHomeShell } from "../../../components/ui/RoleHomeShell";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { queryGateMessage } from "../../../components/ui/queryGateMessage";
import { Card } from "../../../components/ui/Card";
import { LinkButton } from "../../../components/ui/LinkButton";
import { useAdminQuizzes } from "../api/useAdminQuizzes";

export function AdminQuizzesPage() {
  const { t } = useTranslation();
  const { data: quizzes, isLoading, isError } = useAdminQuizzes();

  const gate = queryGateMessage(t, isLoading, isError, "admin.loadError");

  return (
    <RoleHomeShell titleKey="app.title">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <h2 className="text-2xl font-semibold" dir="auto">
          {t("admin.allQuizzes")}
        </h2>
        {gate}
        {!gate && quizzes && (
          <div className="flex flex-col gap-3">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="flex items-center justify-between gap-2">
                <div>
                  <p dir="auto">{quiz.title}</p>
                  <p className="text-sm text-neutral-500" dir="auto">
                    {quiz.classNames.join(", ")} · {t("admin.owner", { name: quiz.ownerName })}
                  </p>
                </div>
                <LinkButton to={`/admin/quizzes/${quiz.id}/results`}>{t("admin.viewResults")}</LinkButton>
              </Card>
            ))}
            {quizzes.length === 0 && <CenteredMessage>{t("results.empty")}</CenteredMessage>}
          </div>
        )}
      </div>
    </RoleHomeShell>
  );
}
