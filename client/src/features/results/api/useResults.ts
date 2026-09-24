import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import type { ResultsResponse } from "./types";

export type ResultsScope = "teacher" | "admin";

export function resultsPath(scope: ResultsScope, quizId: string): string {
  return scope === "teacher" ? `/teacher/quizzes/${quizId}/results` : `/admin/quizzes/${quizId}/results`;
}

export function useResults(scope: ResultsScope, quizId: string) {
  return useQuery({
    queryKey: ["results", scope, quizId],
    queryFn: () => apiClient.get<ResultsResponse>(resultsPath(scope, quizId)),
  });
}
