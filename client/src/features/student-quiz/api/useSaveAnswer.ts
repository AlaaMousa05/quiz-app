import { apiClient } from "../../../lib/apiClient";

export function saveAnswer(attemptId: string, questionId: string, optionId: string | null) {
  return apiClient.patch<{ savedAt: string }>(`/attempts/${attemptId}/answers`, { questionId, optionId });
}
