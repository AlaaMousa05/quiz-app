import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import { studentAttemptReviewKey } from "./queryKeys";
import type { AttemptReview } from "./types";

export function useAttemptReview(attemptId: string) {
  return useQuery({
    queryKey: studentAttemptReviewKey(attemptId),
    queryFn: () => apiClient.get<AttemptReview>(`/attempts/${attemptId}/review`),
  });
}
