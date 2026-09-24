import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import { studentQuizKey } from "./queryKeys";
import type { QuizIntro } from "./types";

export function useQuizIntro(quizId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: studentQuizKey(quizId),
    queryFn: () => apiClient.get<QuizIntro>(`/quizzes/${quizId}`),
    enabled: options?.enabled ?? true,
  });
}
