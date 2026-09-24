import { useTranslation } from "../../../lib/i18n/useTranslation";
import { Dialog } from "../../../components/ui/Dialog";
import { Button } from "../../../components/ui/Button";
import type { AttemptQuestion } from "../api/types";

export function SubmitConfirmDialog({
  open,
  onClose,
  questions,
  answers,
  onConfirm,
  isSubmitting,
  errorMessage,
}: {
  open: boolean;
  onClose: () => void;
  questions: AttemptQuestion[];
  answers: Record<string, string | null>;
  onConfirm: () => void;
  isSubmitting: boolean;
  errorMessage?: string;
}) {
  const { t } = useTranslation();
  const unansweredNumbers = questions
    .map((q, i) => ({ q, number: i + 1 }))
    .filter(({ q }) => !answers[q.id])
    .map(({ number }) => number);

  return (
    <Dialog open={open} onClose={onClose} title={t("studentQuiz.confirm.title")}>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold" dir="auto">
          {t("studentQuiz.confirm.title")}
        </h2>
        <p dir="auto">
          {t("studentQuiz.confirm.answeredCount", {
            answered: questions.length - unansweredNumbers.length,
            total: questions.length,
          })}
        </p>
        {unansweredNumbers.length > 0 && (
          <p className="rounded-md bg-warning-100 p-3 text-sm text-warning-700" dir="auto">
            {t("studentQuiz.confirm.unansweredWarning", {
              count: unansweredNumbers.length,
              numbers: unansweredNumbers.map((n) => `Q${n}`).join(", "),
            })}
          </p>
        )}
        <p className="text-sm text-neutral-500" dir="auto">
          {t("studentQuiz.confirm.cannotUndo")}
        </p>
        {errorMessage && (
          <p role="alert" className="rounded-md bg-danger-100 p-3 text-sm text-danger-700" dir="auto">
            {errorMessage}
          </p>
        )}
        <Button variant="primary" disabled={isSubmitting} onClick={onConfirm}>
          {isSubmitting ? t("common.loading") : t("studentQuiz.confirm.submit")}
        </Button>
        <Button variant="secondary" disabled={isSubmitting} onClick={onClose}>
          {t("studentQuiz.confirm.goBack")}
        </Button>
      </div>
    </Dialog>
  );
}
