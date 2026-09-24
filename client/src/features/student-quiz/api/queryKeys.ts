export const studentQuizzesKey = () => ["student", "quizzes"] as const;
export const studentQuizKey = (quizId: string) => ["student", "quiz", quizId] as const;
export const studentAttemptKey = (attemptId: string) => ["student", "attempt", attemptId] as const;
export const studentAttemptResultKey = (attemptId: string) => ["student", "attempt", attemptId, "result"] as const;
export const studentAttemptReviewKey = (attemptId: string) => ["student", "attempt", attemptId, "review"] as const;
