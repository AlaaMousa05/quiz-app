import { useParams } from "react-router-dom";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { AppShell } from "../../../components/ui/AppShell";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { queryGateMessage } from "../../../components/ui/queryGateMessage";
import { useAttemptPageData } from "../hooks/useAttemptPageData";
import { useAttemptReview } from "../api/useAttemptReview";
import { ReviewQuestionCard } from "../components/ReviewQuestionCard";

export function ReviewPage() {
  const { quizId = "" } = useParams<{ quizId: string }>();
  const { t } = useTranslation();
  const { data: review, isLoading, isError } = useAttemptPageData(quizId, useAttemptReview);

  const gate = queryGateMessage(t, isLoading, isError, "studentQuiz.review.loadError");
  if (gate) return <AppShell>{gate}</AppShell>;
  if (!review) return <AppShell><CenteredMessage>{t("studentQuiz.review.loadError")}</CenteredMessage></AppShell>;

  return (
    <AppShell title={t("studentQuiz.review.title")}>
      <p className="text-sm text-neutral-500" dir="auto">
        {t("studentQuiz.review.finalScore", { score: review.score, maxPoints: review.maxPoints })}
      </p>
      <div className="flex flex-col gap-3">
        {review.questions.map((q, i) => (
          <ReviewQuestionCard key={q.id} question={q} index={i} />
        ))}
      </div>
    </AppShell>
  );
}
