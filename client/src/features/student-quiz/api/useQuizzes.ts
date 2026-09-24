import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import { studentQuizzesKey } from "./queryKeys";
import type { QuizListResponse } from "./types";

export function useQuizzes() {
  return useQuery({
    queryKey: studentQuizzesKey(),
    queryFn: () => apiClient.get<QuizListResponse>("/quizzes"),
  });
}
