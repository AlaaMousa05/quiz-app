import { Prisma } from "@prisma/client";
import { prisma } from "./prismaClient.js";

// Shared with attempt.repository.ts's AttemptWithQuiz include (and reused by
// tests/helpers/attemptFixtures.ts), so all three stay in sync if the
// questions/options shape ever changes. Typed structurally rather than
// against one of Prisma's generated `$fieldNameArgs` types — those are an
// internal, undocumented part of the generated client, not a stable public
// type to depend on.
export const questionsWithOptionsInclude = {
  include: { options: true },
  orderBy: { orderIndex: "asc" as const },
} satisfies { include: { options: true }; orderBy: { orderIndex: "asc" } };

const quizWithQuestionsInclude = {
  questions: questionsWithOptionsInclude,
} satisfies Prisma.QuizInclude;

export type QuizWithQuestions = Prisma.QuizGetPayload<{ include: typeof quizWithQuestionsInclude }>;

// Returns null both when the quiz doesn't exist and when it isn't published
// or isn't assigned to this class — all three read as "not found" to the
// caller (FR-006: no existence leak for a quiz outside the student's class).
export function findPublishedQuizForClass(quizId: string, classId: string): Promise<QuizWithQuestions | null> {
  return prisma.quiz.findFirst({
    where: { id: quizId, status: "PUBLISHED", classes: { some: { classId } } },
    include: quizWithQuestionsInclude,
  });
}

export function listPublishedQuizzesForClass(classId: string) {
  return prisma.quiz.findMany({
    where: { status: "PUBLISHED", classes: { some: { classId } } },
    include: { classes: { include: { class: true } } },
  });
}
