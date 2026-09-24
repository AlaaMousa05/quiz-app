import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import { studentAttemptKey } from "./queryKeys";
import type { AttemptState } from "./types";

export function useAttempt(attemptId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: studentAttemptKey(attemptId),
    queryFn: () => apiClient.get<AttemptState>(`/attempts/${attemptId}`),
    enabled: options?.enabled ?? true,
  });
}
