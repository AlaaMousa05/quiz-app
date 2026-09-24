import { useParams } from "react-router-dom";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { formatDateTime } from "../../../lib/datetime";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { queryGateMessage } from "../../../components/ui/queryGateMessage";
import { Card } from "../../../components/ui/Card";
import { LinkButton } from "../../../components/ui/LinkButton";
import { useAttemptPageData } from "../hooks/useAttemptPageData";
import { useAttemptResult } from "../api/useAttemptResult";

export function ResultPage() {
  const { quizId = "" } = useParams<{ quizId: string }>();
  const { t, lang } = useTranslation();
  const { data: result, isLoading, isError } = useAttemptPageData(quizId, useAttemptResult);

  const gate = queryGateMessage(t, isLoading, isError, "studentQuiz.result.loadError");
  if (gate) return gate;
  if (!result) return <CenteredMessage>{t("studentQuiz.result.loadError")}</CenteredMessage>;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 p-4">
      <Card className="flex flex-col items-center gap-2 text-center">
        <p className="text-3xl font-semibold">
          <bdi>
            {result.score} / {result.maxPoints}
          </bdi>
        </p>
        <p className="text-sm text-neutral-500" dir="auto">
          {t("studentQuiz.result.yourScore")}
        </p>
        {result.submittedAt && (
          <p className="text-sm text-neutral-500">
            <bdi>{t("studentQuiz.result.submittedAt", { date: formatDateTime(result.submittedAt, lang) })}</bdi>
          </p>
        )}
        <p className="text-sm text-neutral-500" dir="auto">
          {t("studentQuiz.result.reviewAvailable", { date: formatDateTime(result.quizClosesAt, lang) })}
        </p>
        <LinkButton variant="primary" to="/quizzes">
          {t("studentQuiz.result.backToQuizzes")}
        </LinkButton>
      </Card>
    </main>
  );
}
