import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import { teacherQuizKey } from "./queryKeys";
import type { TeacherQuizDetail } from "./types";

export function useTeacherQuiz(quizId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: teacherQuizKey(quizId),
    queryFn: () => apiClient.get<TeacherQuizDetail>(`/teacher/quizzes/${quizId}`),
    enabled: options?.enabled ?? true,
  });
}
