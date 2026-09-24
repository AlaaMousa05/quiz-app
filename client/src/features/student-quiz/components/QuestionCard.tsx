import { useTranslation } from "../../../lib/i18n/useTranslation";
import { OPTION_LETTERS, type AttemptQuestion } from "../api/types";

export function QuestionCard({
  question,
  index,
  selectedOptionId,
  onSelect,
}: {
  question: AttemptQuestion;
  index: number;
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="flex w-full items-start justify-between gap-2 text-lg font-medium" dir="auto">
        <span>
          Q{index + 1}. {question.text}
        </span>
        <span className="whitespace-nowrap text-sm text-neutral-500">{t("studentQuiz.taking.points", { points: question.points })}</span>
      </legend>
      <div className="flex flex-col gap-2">
        {question.options.map((option, i) => (
          <label
            key={option.id}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-neutral-300 px-3 py-2 has-[:checked]:border-accent-600 has-[:checked]:bg-accent-100"
          >
            <input
              type="radio"
              name={question.id}
              checked={selectedOptionId === option.id}
              onChange={() => onSelect(option.id)}
              className="h-5 w-5"
            />
            <span className="font-medium">{OPTION_LETTERS[i]}.</span>
            <span dir="auto">{option.text}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
