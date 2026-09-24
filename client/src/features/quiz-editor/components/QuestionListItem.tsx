import { useTranslation } from "../../../lib/i18n/useTranslation";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import type { TeacherQuestion } from "../api/types";

const OPTION_LETTERS = ["A", "B", "C", "D"];

export function QuestionListItem({
  question,
  index,
  locked,
  onEdit,
  onDelete,
}: {
  question: TeacherQuestion;
  index: number;
  locked: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const correctIndex = question.options.findIndex((o) => o.isCorrect);

  return (
    <Card className="flex flex-col gap-2">
      <p dir="auto">
        Q{index + 1}. {question.text}
      </p>
      <p className="text-sm text-neutral-500" dir="auto">
        {t("quizEditor.questions.correctLabel", { letter: OPTION_LETTERS[correctIndex] ?? "?" })} ·{" "}
        {t("quizEditor.questions.pointsLabel", { points: question.points })}
      </p>
      {!locked && (
        <div className="flex justify-end gap-2">
          <Button onClick={onEdit}>{t("quizEditor.edit")}</Button>
          <Button variant="destructive" onClick={onDelete}>
            {t("quizEditor.questions.delete")}
          </Button>
        </div>
      )}
    </Card>
  );
}
