import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { formatDateTime } from "../../../lib/datetime";
import { AppShell } from "../../../components/ui/AppShell";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { queryGateMessage } from "../../../components/ui/queryGateMessage";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { useToast } from "../../../components/ui/Toast";
import { errorMessage } from "../../../lib/errorMessage";
import { useQuizIntro } from "../api/useQuizIntro";
import { useStartAttempt } from "../api/useStartAttempt";

export function QuizIntroPage() {
  const { quizId = "" } = useParams<{ quizId: string }>();
  const { t, lang } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const { data: quiz, isLoading, isError } = useQuizIntro(quizId);
  const startAttempt = useStartAttempt(quizId);

  const gate = queryGateMessage(t, isLoading, isError, "studentQuiz.intro.loadError");
  if (gate) return <AppShell>{gate}</AppShell>;
  if (!quiz) return <AppShell><CenteredMessage>{t("studentQuiz.intro.loadError")}</CenteredMessage></AppShell>;

  const now = new Date();
  const notOpenYet = now < new Date(quiz.opensAt);
  const closedWithoutAttempt = !quiz.hasAttempt && now > new Date(quiz.closesAt);

  function handleStart() {
    startAttempt.mutate(undefined, {
      onSuccess: (result) => navigate(`/quizzes/${quizId}/attempt`, { state: { attemptId: result.attemptId } }),
      onError: (err) => toast.show(errorMessage(t, err), "error"),
    });
  }

  return (
    <AppShell>
      <Card className="mx-auto flex w-full max-w-lg flex-col gap-3">
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

        {startAttempt.isError && (
          <p role="alert" className="rounded-md bg-danger-100 p-3 text-sm text-danger-700" dir="auto">
            {errorMessage(t, startAttempt.error)}
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
          <Button variant="primary" disabled={startAttempt.isPending} onClick={handleStart}>
            {startAttempt.isPending ? t("common.loading") : t("studentQuiz.intro.start")}
          </Button>
        )}
      </Card>
    </AppShell>
  );
}
