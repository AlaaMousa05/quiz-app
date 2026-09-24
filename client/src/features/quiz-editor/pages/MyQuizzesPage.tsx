import { useTranslation } from "../../../lib/i18n/useTranslation";
import { RoleHomeShell } from "../../../components/ui/RoleHomeShell";
import { LinkButton } from "../../../components/ui/LinkButton";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { useTeacherQuizzes } from "../api/useTeacherQuizzes";
import { QuizEditorCard } from "../components/QuizEditorCard";

export function MyQuizzesPage() {
  const { t } = useTranslation();
  const { data: quizzes, isLoading, isError } = useTeacherQuizzes();

  return (
    <RoleHomeShell titleKey="app.title">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold" dir="auto">
            {t("quizEditor.myQuizzes")}
          </h2>
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
      </div>
    </RoleHomeShell>
  );
}
