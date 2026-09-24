import { useTranslation } from "../../../lib/i18n/useTranslation";
import { Card } from "../../../components/ui/Card";
import { LinkButton } from "../../../components/ui/LinkButton";
import type { TeacherQuizListItem } from "../api/types";

export function QuizEditorCard({ quiz }: { quiz: TeacherQuizListItem }) {
  const { t } = useTranslation();

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-medium" dir="auto">
          {quiz.title}
        </h3>
        <span className="whitespace-nowrap text-sm text-neutral-500">
          {t(quiz.status === "PUBLISHED" ? "quizEditor.status.published" : "quizEditor.status.draft")}
        </span>
      </div>
      <p className="text-sm text-neutral-500" dir="auto">
        {quiz.classNames.join(", ")} ·{" "}
        {quiz.status === "PUBLISHED"
          ? t("quizEditor.attempted", { attempted: quiz.attemptCount, enrolled: quiz.enrolledCount })
          : t("quizEditor.notPublishedYet")}
      </p>
      <div className="flex justify-end gap-2">
        <LinkButton to={`/teacher/quizzes/${quiz.id}/settings`}>{t("quizEditor.edit")}</LinkButton>
        {quiz.status === "PUBLISHED" && (
          <LinkButton to={`/teacher/quizzes/${quiz.id}/results`}>{t("results.title")}</LinkButton>
        )}
      </div>
    </Card>
  );
}
