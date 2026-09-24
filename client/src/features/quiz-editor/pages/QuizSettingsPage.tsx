import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { queryGateMessage } from "../../../components/ui/queryGateMessage";
import { useTeacherClasses } from "../api/useTeacherClasses";
import { useTeacherQuiz } from "../api/useTeacherQuiz";
import { useCreateQuiz, useUpdateQuiz } from "../api/useQuizMutations";
import { QuizSettingsForm } from "../components/QuizSettingsForm";

export function QuizSettingsPage() {
  const { quizId } = useParams<{ quizId?: string }>();
  const isEditing = Boolean(quizId);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const classesQuery = useTeacherClasses();
  const quizQuery = useTeacherQuiz(quizId ?? "", { enabled: isEditing });
  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz(quizId ?? "");

  const gate = queryGateMessage(
    t,
    classesQuery.isLoading || (isEditing && quizQuery.isLoading),
    classesQuery.isError || (isEditing && quizQuery.isError),
    "quizEditor.loadError",
  );
  if (gate) return gate;
  if (!classesQuery.data) return <CenteredMessage>{t("quizEditor.loadError")}</CenteredMessage>;

  const mutation = isEditing ? updateQuiz : createQuiz;

  function handleSubmit(values: Parameters<typeof createQuiz.mutate>[0]) {
    if (isEditing) {
      updateQuiz.mutate(values, { onSuccess: () => navigate(`/teacher/quizzes/${quizId}/questions`) });
    } else {
      createQuiz.mutate(values, { onSuccess: (result) => navigate(`/teacher/quizzes/${result.quizId}/questions`) });
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold" dir="auto">
        {t("quizEditor.settings.title")}
      </h1>
      <QuizSettingsForm
        classes={classesQuery.data}
        locked={quizQuery.data?.locked ?? false}
        initialValues={quizQuery.data ?? undefined}
        onSubmit={handleSubmit}
        isSubmitting={mutation.isPending}
        errorMessage={mutation.isError ? t("quizEditor.settings.saveError") : undefined}
        submitLabel={t("quizEditor.settings.next")}
      />
    </main>
  );
}
