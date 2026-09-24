import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { formatDateTime } from "../../../lib/datetime";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { queryGateMessage } from "../../../components/ui/queryGateMessage";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { useQuizIntro } from "../api/useQuizIntro";
import { useStartAttempt } from "../api/useStartAttempt";

export function QuizIntroPage() {
  const { quizId = "" } = useParams<{ quizId: string }>();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const { data: quiz, isLoading, isError } = useQuizIntro(quizId);
  const startAttempt = useStartAttempt(quizId);

  const gate = queryGateMessage(t, isLoading, isError, "studentQuiz.intro.loadError");
  if (gate) return gate;
  if (!quiz) return <CenteredMessage>{t("studentQuiz.intro.loadError")}</CenteredMessage>;

  const now = new Date();
  const notOpenYet = now < new Date(quiz.opensAt);
  const closedWithoutAttempt = !quiz.hasAttempt && now > new Date(quiz.closesAt);

  async function handleStart() {
    const result = await startAttempt.mutateAsync();
    navigate(`/quizzes/${quizId}/attempt`, { state: { attemptId: result.attemptId } });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 p-4">
      <Card className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold" dir="auto">
          {quiz.title}
        </h1>
        <p className="text-sm text-neutral-500">⏱ {t("studentQuiz.intro.timeLimit", { minutes: quiz.timeLimitMinutes })}</p>
        <p className="text-sm text-neutral-500">Σ {t("studentQuiz.intro.totalPoints", { points: quiz.totalPoints })}</p>
        <p className="text-sm text-neutral-500">✎ {t("studentQuiz.intro.questionCount", { count: quiz.questionCount })}</p>

        <div className="rounded-md bg-neutral-50 p-3 text-sm" dir="auto">
          {quiz.negMarkEnabled
            ? t("studentQuiz.intro.negMarkOn", { percent: Math.round(quiz.negMarkPenalty * 100) })
            : t("studentQuiz.intro.negMarkOff")}
        </div>

        {!quiz.hasAttempt && !notOpenYet && !closedWithoutAttempt && (
          <p className="rounded-md bg-warning-100 p-3 text-sm text-warning-700" dir="auto">
            {t("studentQuiz.intro.oneAttemptWarning")}
          </p>
        )}

        {notOpenYet && (
          <Button disabled>{t("studentQuiz.intro.notOpenYet", { date: formatDateTime(quiz.opensAt, lang) })}</Button>
        )}
        {closedWithoutAttempt && <p dir="auto">{t("studentQuiz.intro.closedNoAttempt")}</p>}
        {!notOpenYet && !closedWithoutAttempt && quiz.hasAttempt && (
          <Button
            variant="primary"
            onClick={() => navigate(`/quizzes/${quizId}/attempt`, { state: { attemptId: quiz.attemptId } })}
          >
            {t("studentQuiz.intro.resume")}
          </Button>
        )}
        {!notOpenYet && !closedWithoutAttempt && !quiz.hasAttempt && (
          <Button variant="primary" disabled={startAttempt.isPending} onClick={() => void handleStart()}>
            {t("studentQuiz.intro.start")}
          </Button>
        )}
      </Card>
    </main>
  );
}
