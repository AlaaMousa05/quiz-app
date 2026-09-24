import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { queryGateMessage } from "../../../components/ui/queryGateMessage";
import { Button } from "../../../components/ui/Button";
import { useTeacherQuiz } from "../api/useTeacherQuiz";
import { useAddQuestion, useDeleteQuestion, useEditQuestion, usePublishQuiz, useUnpublishQuiz } from "../api/useQuizMutations";
import { QuestionListItem } from "../components/QuestionListItem";
import { QuestionFormDialog } from "../components/QuestionFormDialog";
import type { QuestionFormInput, TeacherQuestion } from "../api/types";

export function QuestionsEditorPage() {
  const { quizId = "" } = useParams<{ quizId: string }>();
  const { t } = useTranslation();
  const { data: quiz, isLoading, isError } = useTeacherQuiz(quizId);
  const addQuestion = useAddQuestion(quizId);
  const editQuestion = useEditQuestion(quizId);
  const deleteQuestion = useDeleteQuestion(quizId);
  const publishQuiz = usePublishQuiz(quizId);
  const unpublishQuiz = useUnpublishQuiz(quizId);

  const [editingQuestion, setEditingQuestion] = useState<TeacherQuestion | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);

  const gate = queryGateMessage(t, isLoading, isError, "quizEditor.loadError");
  if (gate) return gate;
  if (!quiz) return <CenteredMessage>{t("quizEditor.loadError")}</CenteredMessage>;

  function openAddForm() {
    setEditingQuestion(undefined);
    setFormOpen(true);
  }

  function openEditForm(question: TeacherQuestion) {
    setEditingQuestion(question);
    setFormOpen(true);
  }

  function handleFormSubmit(input: QuestionFormInput) {
    const onSuccess = () => setFormOpen(false);
    if (editingQuestion) {
      editQuestion.mutate({ questionId: editingQuestion.id, input }, { onSuccess });
    } else {
      addQuestion.mutate(input, { onSuccess });
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" dir="auto">
          {t("quizEditor.questions.title", { count: quiz.questions.length })}
        </h1>
        {!quiz.locked && <Button onClick={openAddForm}>{t("quizEditor.questions.add")}</Button>}
      </div>

      {quiz.locked && (
        <p className="rounded-md bg-warning-100 p-3 text-sm text-warning-700" dir="auto">
          {t("quizEditor.questions.lockedBanner")}
        </p>
      )}

      {quiz.questions.length === 0 ? (
        <p className="text-sm text-neutral-500" dir="auto">
          {t("quizEditor.questions.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {quiz.questions.map((q, i) => (
            <QuestionListItem
              key={q.id}
              question={q}
              index={i}
              locked={quiz.locked}
              onEdit={() => openEditForm(q)}
              onDelete={() => deleteQuestion.mutate(q.id)}
            />
          ))}
        </div>
      )}

      {!quiz.locked && (
        <Button
          variant="primary"
          disabled={publishQuiz.isPending || unpublishQuiz.isPending}
          onClick={() => (quiz.status === "PUBLISHED" ? unpublishQuiz.mutate() : publishQuiz.mutate())}
        >
          {t(quiz.status === "PUBLISHED" ? "quizEditor.questions.unpublish" : "quizEditor.questions.publish")}
        </Button>
      )}
      {publishQuiz.isError && (
        <p role="alert" className="text-sm text-danger-700" dir="auto">
          {t("quizEditor.questions.publishError")}
        </p>
      )}

      <QuestionFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        question={editingQuestion}
        onSubmit={handleFormSubmit}
        isSubmitting={addQuestion.isPending || editQuestion.isPending}
      />
    </main>
  );
}
