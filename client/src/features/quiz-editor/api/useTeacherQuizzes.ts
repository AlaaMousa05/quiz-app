import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import { teacherQuizzesKey } from "./queryKeys";
import type { TeacherQuizListItem } from "./types";

export function useTeacherQuizzes() {
  return useQuery({
    queryKey: teacherQuizzesKey(),
    queryFn: () => apiClient.get<TeacherQuizListItem[]>("/teacher/quizzes"),
  });
}
