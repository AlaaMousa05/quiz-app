import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { AppShell } from "../../../components/ui/AppShell";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { queryGateMessage } from "../../../components/ui/queryGateMessage";
import { useToast } from "../../../components/ui/Toast";
import { errorMessage } from "../../../lib/errorMessage";
import { useTeacherClasses } from "../api/useTeacherClasses";
import { useTeacherQuiz } from "../api/useTeacherQuiz";
import { useCreateQuiz, useUpdateQuiz } from "../api/useQuizMutations";
import { QuizSettingsForm } from "../components/QuizSettingsForm";

export function QuizSettingsPage() {
  const { quizId } = useParams<{ quizId?: string }>();
  const isEditing = Boolean(quizId);
  const { t } = useTranslation();
  const toast = useToast();
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
  if (gate) return <AppShell>{gate}</AppShell>;
  if (!classesQuery.data) return <AppShell><CenteredMessage>{t("quizEditor.loadError")}</CenteredMessage></AppShell>;

  const mutation = isEditing ? updateQuiz : createQuiz;

  function handleSubmit(values: Parameters<typeof createQuiz.mutate>[0]) {
    if (isEditing) {
      updateQuiz.mutate(values, {
        onSuccess: () => {
          toast.show(t("toast.updated"));
          navigate(`/teacher/quizzes/${quizId}/questions`);
        },
      });
    } else {
      createQuiz.mutate(values, {
        onSuccess: (result) => {
          toast.show(t("toast.created"));
          navigate(`/teacher/quizzes/${result.quizId}/questions`);
        },
      });
    }
  }

  return (
    <AppShell title={t("quizEditor.settings.title")}>
      <QuizSettingsForm
        classes={classesQuery.data}
        locked={quizQuery.data?.locked ?? false}
        initialValues={quizQuery.data ?? undefined}
        onSubmit={handleSubmit}
        isSubmitting={mutation.isPending}
        errorMessage={mutation.isError ? errorMessage(t, mutation.error, "quizEditor.settings.saveError") : undefined}
        submitLabel={t("quizEditor.settings.next")}
      />
    </AppShell>
  );
}
