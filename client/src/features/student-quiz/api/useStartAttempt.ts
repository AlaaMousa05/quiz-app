import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import { studentQuizKey, studentQuizzesKey } from "./queryKeys";

export function useStartAttempt(quizId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<{ attemptId: string }>(`/quizzes/${quizId}/attempts`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: studentQuizKey(quizId) });
      void queryClient.invalidateQueries({ queryKey: studentQuizzesKey() });
    },
  });
}
