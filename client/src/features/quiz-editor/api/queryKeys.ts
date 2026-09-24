export const teacherClassesKey = () => ["teacher", "classes"] as const;
export const teacherQuizzesKey = () => ["teacher", "quizzes"] as const;
export const teacherQuizKey = (quizId: string) => ["teacher", "quiz", quizId] as const;
