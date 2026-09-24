import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import { studentAttemptResultKey } from "./queryKeys";
import type { AttemptResult } from "./types";

export function useAttemptResult(attemptId: string) {
  return useQuery({
    queryKey: studentAttemptResultKey(attemptId),
    queryFn: () => apiClient.get<AttemptResult>(`/attempts/${attemptId}/result`),
  });
}
