import { useTranslation } from "../../../lib/i18n/useTranslation";
import { AppShell } from "../../../components/ui/AppShell";
import { LinkButton } from "../../../components/ui/LinkButton";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { useTeacherQuizzes } from "../api/useTeacherQuizzes";
import { QuizEditorCard } from "../components/QuizEditorCard";

export function MyQuizzesPage() {
  const { t } = useTranslation();
  const { data: quizzes, isLoading, isError } = useTeacherQuizzes();

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold" dir="auto">
          {t("quizEditor.myQuizzes")}
        </h1>
        <div className="flex gap-2">
          <LinkButton to="/teacher/quizzes/import">{t("quizEditor.import")}</LinkButton>
          <LinkButton variant="primary" to="/teacher/quizzes/new">
            {t("quizEditor.newQuiz")}
          </LinkButton>
        </div>
      </div>

      {isLoading && <CenteredMessage>{t("common.loading")}</CenteredMessage>}
      {isError && <CenteredMessage>{t("quizEditor.loadError")}</CenteredMessage>}
      {quizzes && quizzes.length === 0 && (
        <p className="text-sm text-neutral-500" dir="auto">
          {t("quizEditor.empty")}
        </p>
      )}
      {quizzes && quizzes.length > 0 && (
        <div className="flex flex-col gap-3">
          {quizzes.map((quiz) => (
            <QuizEditorCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
