import { useTranslation } from "../../../lib/i18n/useTranslation";
import { formatDateTime } from "../../../lib/datetime";
import { Card } from "../../../components/ui/Card";
import { LinkButton } from "../../../components/ui/LinkButton";
import type { QuizSummary } from "../api/types";

export function QuizCard({ quiz, bucket }: { quiz: QuizSummary; bucket: "open" | "upcoming" | "done" }) {
  const { t, lang } = useTranslation();
  const quizClosed = bucket === "done" && new Date() >= new Date(quiz.closesAt);

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-medium" dir="auto">
          {quiz.title}
        </h3>
        <span className="whitespace-nowrap text-sm text-neutral-500">
          ⏱ {t("studentQuiz.timeLimitMinutes", { minutes: quiz.timeLimitMinutes })}
        </span>
      </div>
      <p className="text-sm text-neutral-500" dir="auto">
        {quiz.classNames.join(", ")}
      </p>
      <p className="text-sm text-neutral-500">
        <bdi>
          {bucket === "upcoming"
            ? t("studentQuiz.opensAt", { date: formatDateTime(quiz.opensAt, lang) })
            : t("studentQuiz.openUntil", { date: formatDateTime(quiz.closesAt, lang) })}
        </bdi>
      </p>
      <div className="flex justify-end">
        {bucket === "open" && <LinkButton variant="primary" to={`/quizzes/${quiz.id}`}>{t("studentQuiz.start")}</LinkButton>}
        {bucket === "done" && (
          <LinkButton variant="secondary" to={quizClosed ? `/quizzes/${quiz.id}/review` : `/quizzes/${quiz.id}/result`}>
            {t(quizClosed ? "studentQuiz.viewReview" : "studentQuiz.viewResult")}
          </LinkButton>
        )}
      </div>
    </Card>
  );
}
