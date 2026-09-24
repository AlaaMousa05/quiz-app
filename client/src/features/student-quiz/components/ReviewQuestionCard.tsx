import { useTranslation } from "../../../lib/i18n/useTranslation";
import { Card } from "../../../components/ui/Card";
import { OPTION_LETTERS, type ReviewQuestion } from "../api/types";

function optionLabel(question: ReviewQuestion, optionId: string): string {
  const index = question.options.findIndex((o) => o.id === optionId);
  const option = question.options[index];
  if (!option) return "";
  return `${OPTION_LETTERS[index]}. ${option.text}`;
}

export function ReviewQuestionCard({ question, index }: { question: ReviewQuestion; index: number }) {
  const { t } = useTranslation();
  const { selectedOptionId } = question;
  const isCorrect = selectedOptionId === question.correctOptionId;

  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-start justify-between gap-2">
        <h3 dir="auto">
          Q{index + 1}. {question.text}
        </h3>
        <span className={selectedOptionId === null ? "text-neutral-500" : isCorrect ? "text-success-700" : "text-danger-700"}>
          {selectedOptionId === null ? "0 pts" : isCorrect ? `✓ +${question.pointsAwarded}` : `✗ ${question.pointsAwarded}`}
        </span>
      </div>
      {selectedOptionId === null ? (
        <p className="text-sm text-neutral-500" dir="auto">
          {t("studentQuiz.review.notAnswered")}
        </p>
      ) : (
        <p className="text-sm" dir="auto">
          {t("studentQuiz.review.yourAnswer", { answer: optionLabel(question, selectedOptionId) })}
        </p>
      )}
      {!isCorrect && (
        <p className="text-sm" dir="auto">
          {t("studentQuiz.review.correctAnswer", { answer: optionLabel(question, question.correctOptionId) })}
        </p>
      )}
    </Card>
  );
}
