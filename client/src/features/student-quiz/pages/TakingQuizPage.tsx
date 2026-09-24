import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { queryGateMessage } from "../../../components/ui/queryGateMessage";
import { Dialog } from "../../../components/ui/Dialog";
import { errorMessage } from "../../../lib/errorMessage";
import { useTakingQuiz } from "../hooks/useTakingQuiz";
import { QuestionCard } from "../components/QuestionCard";
import { QuestionGrid } from "../components/QuestionGrid";
import { SubmitConfirmDialog } from "../components/SubmitConfirmDialog";
import { AttemptHeader } from "../components/AttemptHeader";
import { AttemptFooterNav } from "../components/AttemptFooterNav";

export function TakingQuizPage() {
  const { quizId = "" } = useParams<{ quizId: string }>();
  const { t } = useTranslation();
  const quiz = useTakingQuiz(quizId);
  const [gridOpen, setGridOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const gate = queryGateMessage(t, quiz.isLoading, quiz.isError, "studentQuiz.intro.loadError");
  if (gate) return gate;

  // useTakingQuiz's isLoading includes `!attempt`, and the gate above
  // already returned on isLoading, so attempt is guaranteed set here.
  const attempt = quiz.attempt!;
  const question = attempt.questions[quiz.currentIndex];
  if (!question) {
    return <CenteredMessage>{t("studentQuiz.intro.loadError")}</CenteredMessage>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AttemptHeader
        serverRemainingSeconds={attempt.remainingSeconds}
        onExpire={() => void quiz.submit()}
        currentIndex={quiz.currentIndex}
        totalQuestions={attempt.questions.length}
        autosaveStatus={quiz.autosave.status}
      />

      <main className="flex-1 p-4">
        <QuestionCard
          question={question}
          index={quiz.currentIndex}
          selectedOptionId={quiz.answers[question.id] ?? null}
          onSelect={(optionId) => quiz.selectOption(question.id, optionId)}
        />
      </main>

      <AttemptFooterNav
        isFirst={quiz.currentIndex === 0}
        isLast={quiz.currentIndex === attempt.questions.length - 1}
        onPrev={() => quiz.setCurrentIndex((i) => Math.max(0, i - 1))}
        onNext={() => quiz.setCurrentIndex((i) => Math.min(attempt.questions.length - 1, i + 1))}
        onOpenGrid={() => setGridOpen(true)}
        onOpenSubmitConfirm={() => setConfirmOpen(true)}
      />

      <Dialog open={gridOpen} onClose={() => setGridOpen(false)} title={t("studentQuiz.taking.gridTitle")}>
        <QuestionGrid
          questions={attempt.questions}
          answers={quiz.answers}
          currentIndex={quiz.currentIndex}
          onJump={(i) => {
            quiz.setCurrentIndex(i);
            setGridOpen(false);
          }}
          onSubmit={() => {
            setGridOpen(false);
            setConfirmOpen(true);
          }}
        />
      </Dialog>

      <SubmitConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        questions={attempt.questions}
        answers={quiz.answers}
        isSubmitting={quiz.isSubmitting}
        errorMessage={quiz.isSubmitError ? errorMessage(t, quiz.submitError, "studentQuiz.confirm.submitError") : undefined}
        onConfirm={() => void quiz.submit()}
      />
    </div>
  );
}
