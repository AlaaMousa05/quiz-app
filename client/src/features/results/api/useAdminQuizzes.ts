import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import type { AdminQuizListItem } from "./types";

export function useAdminQuizzes() {
  return useQuery({
    queryKey: ["admin", "quizzes"],
    queryFn: () => apiClient.get<AdminQuizListItem[]>("/admin/quizzes"),
  });
}
