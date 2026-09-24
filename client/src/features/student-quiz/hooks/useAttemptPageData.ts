import { useResolvedAttemptId } from "./useResolvedAttemptId";

// Shared by every page that (a) resolves an attemptId for a quiz route, then
// (b) fetches something scoped to that attempt (ResultPage, ReviewPage) —
// factors out the "resolve, then fetch, then combine loading/error" boolean
// composition so it isn't hand-duplicated per page.
export function useAttemptPageData<T>(
  quizId: string,
  useAttemptQuery: (attemptId: string) => { data: T | undefined; isLoading: boolean; isError: boolean },
) {
  const { attemptId, isLoading: isResolving, isError: resolveError } = useResolvedAttemptId(quizId);
  const { data, isLoading, isError } = useAttemptQuery(attemptId ?? "");
  const notFound = !isResolving && !resolveError && !attemptId;

  return {
    data,
    isLoading: isResolving || (Boolean(attemptId) && isLoading),
    isError: resolveError || isError || notFound,
  };
}
