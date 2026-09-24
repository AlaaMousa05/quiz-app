import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import { teacherQuizKey, teacherQuizzesKey } from "./queryKeys";
import type { QuestionFormInput, QuizSettingsFormInput, TeacherQuestion } from "./types";

function useInvalidateQuiz(quizId?: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: teacherQuizzesKey() });
    if (quizId) void queryClient.invalidateQueries({ queryKey: teacherQuizKey(quizId) });
  };
}

export function useCreateQuiz() {
  const invalidate = useInvalidateQuiz();
  return useMutation({
    mutationFn: (input: QuizSettingsFormInput) => apiClient.post<{ quizId: string }>("/teacher/quizzes", input),
    onSuccess: invalidate,
  });
}

export function useUpdateQuiz(quizId: string) {
  const invalidate = useInvalidateQuiz(quizId);
  return useMutation({
    mutationFn: (input: Partial<QuizSettingsFormInput>) => apiClient.patch(`/teacher/quizzes/${quizId}`, input),
    onSuccess: invalidate,
  });
}

export function useAddQuestion(quizId: string) {
  const invalidate = useInvalidateQuiz(quizId);
  return useMutation({
    mutationFn: (input: QuestionFormInput) => apiClient.post<TeacherQuestion>(`/teacher/quizzes/${quizId}/questions`, input),
    onSuccess: invalidate,
  });
}

export function useEditQuestion(quizId: string) {
  const invalidate = useInvalidateQuiz(quizId);
  return useMutation({
    mutationFn: ({ questionId, input }: { questionId: string; input: QuestionFormInput }) =>
      apiClient.patch<TeacherQuestion>(`/teacher/quizzes/${quizId}/questions/${questionId}`, input),
    onSuccess: invalidate,
  });
}

export function useDeleteQuestion(quizId: string) {
  const invalidate = useInvalidateQuiz(quizId);
  return useMutation({
    mutationFn: (questionId: string) => apiClient.delete(`/teacher/quizzes/${quizId}/questions/${questionId}`),
    onSuccess: invalidate,
  });
}

export function usePublishQuiz(quizId: string) {
  const invalidate = useInvalidateQuiz(quizId);
  return useMutation({
    mutationFn: () => apiClient.post(`/teacher/quizzes/${quizId}/publish`),
    onSuccess: invalidate,
  });
}

export function useUnpublishQuiz(quizId: string) {
  const invalidate = useInvalidateQuiz(quizId);
  return useMutation({
    mutationFn: () => apiClient.post(`/teacher/quizzes/${quizId}/unpublish`),
    onSuccess: invalidate,
  });
}
