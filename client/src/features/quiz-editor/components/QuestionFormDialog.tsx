import { useState, type FormEvent } from "react";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { Dialog } from "../../../components/ui/Dialog";
import { Field } from "../../../components/ui/Field";
import { Button } from "../../../components/ui/Button";
import type { QuestionFormInput, TeacherQuestion } from "../api/types";

const OPTION_LETTERS = ["A", "B", "C", "D"];

function initialOptions(question?: TeacherQuestion) {
  if (question) return question.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }));
  return OPTION_LETTERS.map(() => ({ text: "", isCorrect: false }));
}

export function QuestionFormDialog({
  open,
  onClose,
  question,
  onSubmit,
  isSubmitting,
  errorMessage,
}: {
  open: boolean;
  onClose: () => void;
  question?: TeacherQuestion;
  onSubmit: (input: QuestionFormInput) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}) {
  const { t } = useTranslation();
  const [text, setText] = useState(question?.text ?? "");
  const [points, setPoints] = useState(question?.points ?? 5);
  const [options, setOptions] = useState(initialOptions(question));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ text, points, options });
  }

  return (
    <Dialog open={open} onClose={onClose} title={t("quizEditor.questionForm.title")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" dir="auto">
        <Field label={t("quizEditor.questionForm.title")} value={text} onChange={(e) => setText(e.target.value)} required />
        <Field
          type="number"
          min={0.01}
          step="any"
          label={t("quizEditor.questionForm.points")}
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          required
        />
        {options.map((option, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correctOption"
              className="h-5 w-5"
              checked={option.isCorrect}
              onChange={() => setOptions((prev) => prev.map((o, j) => ({ ...o, isCorrect: j === i })))}
              aria-label={t("quizEditor.questionForm.correctOption")}
            />
            <Field
              // `options` always has exactly 4 entries (OPTION_LETTERS.length),
              // so `i` is always a valid index into OPTION_LETTERS.
              label={t("quizEditor.questionForm.option", { letter: OPTION_LETTERS[i]! })}
              value={option.text}
              onChange={(e) => setOptions((prev) => prev.map((o, j) => (j === i ? { ...o, text: e.target.value } : o)))}
              required
            />
          </div>
        ))}

        {errorMessage && (
          <p role="alert" className="rounded-md bg-danger-100 p-3 text-sm text-danger-700" dir="auto">
            {errorMessage}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? t("common.loading") : t("quizEditor.questionForm.save")}
          </Button>
          <Button type="button" onClick={onClose} disabled={isSubmitting}>
            {t("quizEditor.questionForm.cancel")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
