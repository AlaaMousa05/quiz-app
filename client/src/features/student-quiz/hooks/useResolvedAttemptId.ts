import { useLocation } from "react-router-dom";
import { useQuizIntro } from "../api/useQuizIntro";

// The attempt route (`/quizzes/:quizId/attempt`) doesn't carry an attemptId
// segment (ui.md S4's route is quiz-scoped). Right after Start, the id is
// passed via router state for a snappy transition; on a refresh or a direct
// link (the resume case FR-008a requires), router state is gone, so this
// falls back to the quiz intro's `attemptId` field.
export function useResolvedAttemptId(quizId: string): { attemptId: string | undefined; isLoading: boolean; isError: boolean } {
  const location = useLocation();
  const stateAttemptId = (location.state as { attemptId?: string } | null)?.attemptId;
  // Skip the fallback fetch entirely on the common path (router state already
  // has the id from a just-completed Start/Continue) — only hits the network
  // for a refresh or a direct link.
  const introQuery = useQuizIntro(quizId, { enabled: !stateAttemptId });

  if (stateAttemptId) {
    return { attemptId: stateAttemptId, isLoading: false, isError: false };
  }
  return { attemptId: introQuery.data?.attemptId, isLoading: introQuery.isLoading, isError: introQuery.isError };
}
