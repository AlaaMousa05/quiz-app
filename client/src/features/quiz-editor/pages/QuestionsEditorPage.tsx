import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { AppShell } from "../../../components/ui/AppShell";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { queryGateMessage } from "../../../components/ui/queryGateMessage";
import { Button } from "../../../components/ui/Button";
import { useToast } from "../../../components/ui/Toast";
import { errorMessage } from "../../../lib/errorMessage";
import { useTeacherQuiz } from "../api/useTeacherQuiz";
import { useAddQuestion, useDeleteQuestion, useEditQuestion, usePublishQuiz, useUnpublishQuiz } from "../api/useQuizMutations";
import { QuestionListItem } from "../components/QuestionListItem";
import { QuestionFormDialog } from "../components/QuestionFormDialog";
import type { QuestionFormInput, TeacherQuestion } from "../api/types";

export function QuestionsEditorPage() {
  const { quizId = "" } = useParams<{ quizId: string }>();
  const { t } = useTranslation();
  const toast = useToast();
  const { data: quiz, isLoading, isError } = useTeacherQuiz(quizId);
  const addQuestion = useAddQuestion(quizId);
  const editQuestion = useEditQuestion(quizId);
  const deleteQuestion = useDeleteQuestion(quizId);
  const publishQuiz = usePublishQuiz(quizId);
  const unpublishQuiz = useUnpublishQuiz(quizId);

  const [editingQuestion, setEditingQuestion] = useState<TeacherQuestion | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);

  const gate = queryGateMessage(t, isLoading, isError, "quizEditor.loadError");
  if (gate) return <AppShell>{gate}</AppShell>;
  if (!quiz) return <AppShell><CenteredMessage>{t("quizEditor.loadError")}</CenteredMessage></AppShell>;

  function openAddForm() {
    setEditingQuestion(undefined);
    setFormOpen(true);
  }

  function openEditForm(question: TeacherQuestion) {
    setEditingQuestion(question);
    setFormOpen(true);
  }

  function handleFormSubmit(input: QuestionFormInput) {
    const onSuccess = () => {
      setFormOpen(false);
      toast.show(t(editingQuestion ? "toast.updated" : "toast.created"));
    };
    if (editingQuestion) {
      editQuestion.mutate({ questionId: editingQuestion.id, input }, { onSuccess });
    } else {
      addQuestion.mutate(input, { onSuccess });
    }
  }

  function handleDelete(questionId: string) {
    deleteQuestion.mutate(questionId, {
      onSuccess: () => toast.show(t("toast.deleted")),
      onError: (err) => toast.show(errorMessage(t, err), "error"),
    });
  }

  const activeMutation = editingQuestion ? editQuestion : addQuestion;

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" dir="auto">
          {t("quizEditor.questions.title", { count: quiz.questions.length })}
        </h1>
        {!quiz.locked && <Button variant="primary" onClick={openAddForm}>{t("quizEditor.questions.add")}</Button>}
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
              onDelete={() => handleDelete(q.id)}
            />
          ))}
        </div>
      )}

      {!quiz.locked && (
        <Button
          variant="primary"
          disabled={publishQuiz.isPending || unpublishQuiz.isPending}
          onClick={() => {
            const action = quiz.status === "PUBLISHED" ? unpublishQuiz : publishQuiz;
            action.mutate(undefined, {
              onSuccess: () => toast.show(t("toast.done")),
              onError: (err) => toast.show(errorMessage(t, err, "quizEditor.questions.publishError"), "error"),
            });
          }}
        >
          {t(quiz.status === "PUBLISHED" ? "quizEditor.questions.unpublish" : "quizEditor.questions.publish")}
        </Button>
      )}

      <QuestionFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        question={editingQuestion}
        onSubmit={handleFormSubmit}
        isSubmitting={addQuestion.isPending || editQuestion.isPending}
        errorMessage={activeMutation.isError ? errorMessage(t, activeMutation.error) : undefined}
      />
    </AppShell>
  );
}
