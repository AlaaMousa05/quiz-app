import { useTranslation } from "../../../lib/i18n/useTranslation";
import { Button } from "../../../components/ui/Button";
import type { AttemptQuestion } from "../api/types";

export function QuestionGrid({
  questions,
  answers,
  currentIndex,
  onJump,
  onSubmit,
}: {
  questions: AttemptQuestion[];
  answers: Record<string, string | null>;
  currentIndex: number;
  onJump: (index: number) => void;
  onSubmit: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold" dir="auto">
        {t("studentQuiz.taking.gridTitle")}
      </h2>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, i) => {
          const isAnswered = Boolean(answers[q.id]);
          const isCurrent = i === currentIndex;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(i)}
              aria-current={isCurrent}
              className={`min-h-11 rounded-md border text-sm font-medium ${
                isCurrent
                  ? "border-accent-600 bg-accent-100"
                  : isAnswered
                    ? "border-neutral-300 bg-neutral-100"
                    : "border-neutral-300 bg-white"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
        <span>{t("studentQuiz.taking.legendAnswered")}</span>
        <span>{t("studentQuiz.taking.legendUnanswered")}</span>
        <span>{t("studentQuiz.taking.legendCurrent")}</span>
      </div>
      <Button variant="primary" onClick={onSubmit}>
        {t("studentQuiz.taking.submitQuiz")}
      </Button>
    </div>
  );
}
