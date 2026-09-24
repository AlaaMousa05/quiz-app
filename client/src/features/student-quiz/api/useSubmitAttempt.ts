import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import { studentAttemptKey, studentQuizzesKey } from "./queryKeys";
import type { SubmitResult } from "./types";

export function useSubmitAttempt(attemptId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<SubmitResult>(`/attempts/${attemptId}/submit`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: studentAttemptKey(attemptId) });
      void queryClient.invalidateQueries({ queryKey: studentQuizzesKey() });
    },
  });
}
