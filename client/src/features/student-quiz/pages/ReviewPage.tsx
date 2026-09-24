import { useParams } from "react-router-dom";
import { useTranslation } from "../../../lib/i18n/useTranslation";
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
  if (gate) return gate;
  if (!review) return <CenteredMessage>{t("studentQuiz.review.loadError")}</CenteredMessage>;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-3 p-4">
      <h1 className="text-xl font-semibold" dir="auto">
        {t("studentQuiz.review.title")}
      </h1>
      <p className="text-sm text-neutral-500" dir="auto">
        {t("studentQuiz.review.finalScore", { score: review.score, maxPoints: review.maxPoints })}
      </p>
      <div className="flex flex-col gap-3">
        {review.questions.map((q, i) => (
          <ReviewQuestionCard key={q.id} question={q} index={i} />
        ))}
      </div>
    </main>
  );
}
