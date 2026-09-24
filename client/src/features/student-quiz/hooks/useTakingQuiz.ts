import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useResolvedAttemptId } from "./useResolvedAttemptId";
import { useAttempt } from "../api/useAttempt";
import { useSubmitAttempt } from "../api/useSubmitAttempt";
import { saveAnswer } from "../api/useSaveAnswer";
import { useAutosave } from "./useAutosave";

// Owns the whole S4 "Taking Quiz" state machine — attempt resolution,
// answers, current question, autosave, and submit — so the page component
// can stay a thin renderer over this view model (CLAUDE.md: feature
// logic/state belongs in hooks/, not pages/). The per-second countdown
// itself is NOT owned here: AttemptHeader subscribes to it directly, so the
// once-a-second tick only re-renders the header, not the whole question +
// dialogs tree.
export function useTakingQuiz(quizId: string) {
  const navigate = useNavigate();
  const { attemptId, isLoading: isResolvingAttempt, isError: resolveError } = useResolvedAttemptId(quizId);
  const { data: attempt, isLoading: isLoadingAttempt, isError: attemptError } = useAttempt(attemptId ?? "", {
    enabled: Boolean(attemptId),
  });
  const submitAttempt = useSubmitAttempt(attemptId ?? "");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const hasHydratedAnswers = useRef(false);

  useEffect(() => {
    if (attempt && !hasHydratedAnswers.current) {
      setAnswers(attempt.answers);
      hasHydratedAnswers.current = true;
    }
  }, [attempt]);

  const saveFn = useCallback(
    (value: { questionId: string; optionId: string }) => saveAnswer(attemptId ?? "", value.questionId, value.optionId),
    [attemptId],
  );
  const autosave = useAutosave(saveFn);

  const submit = useCallback(async () => {
    await submitAttempt.mutateAsync();
    navigate(`/quizzes/${quizId}/result`);
  }, [submitAttempt, navigate, quizId]);

  function selectOption(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    autosave.save({ questionId, optionId });
  }

  return {
    isLoading: isResolvingAttempt || (Boolean(attemptId) && isLoadingAttempt) || !attempt,
    isError: resolveError || attemptError,
    attempt,
    currentIndex,
    setCurrentIndex,
    answers,
    selectOption,
    autosave,
    submit,
    isSubmitting: submitAttempt.isPending,
    isSubmitError: submitAttempt.isError,
  };
}
