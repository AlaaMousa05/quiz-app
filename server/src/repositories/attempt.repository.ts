import { Prisma, type AttemptStatus } from "@prisma/client";
import { prisma } from "./prismaClient.js";
import { ConflictError } from "../errors/index.js";
import { questionsWithOptionsInclude } from "./quiz.repository.js";

const attemptWithQuizInclude = {
  quiz: { include: { questions: questionsWithOptionsInclude } },
  answers: true,
} satisfies Prisma.AttemptInclude;

export type AttemptWithQuiz = Prisma.AttemptGetPayload<{ include: typeof attemptWithQuizInclude }>;

export async function createAttempt(data: {
  quizId: string;
  studentId: string;
  startedAt: Date;
  deadlineAt: Date;
}) {
  try {
    return await prisma.attempt.create({ data });
  } catch (err) {
    // Two near-simultaneous starts race on the DB unique constraint
    // (@@unique([quizId, studentId])) — the loser's create throws P2002
    // rather than silently producing a duplicate row (FR-007).
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError("An attempt already exists for this quiz.");
    }
    throw err;
  }
}

export function findAttemptById(attemptId: string): Promise<AttemptWithQuiz | null> {
  return prisma.attempt.findUnique({ where: { id: attemptId }, include: attemptWithQuizInclude });
}

export function findAttemptByQuizAndStudent(quizId: string, studentId: string) {
  return prisma.attempt.findUnique({ where: { quizId_studentId: { quizId, studentId } } });
}

// One query for the whole quiz list, instead of one findUnique per quiz.
export function findAttemptsByStudentAndQuizIds(studentId: string, quizIds: string[]) {
  return prisma.attempt.findMany({ where: { studentId, quizId: { in: quizIds } } });
}

export function upsertAnswer(attemptId: string, questionId: string, optionId: string | null, answeredAt: Date) {
  return prisma.answer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: { attemptId, questionId, optionId, answeredAt },
    update: { optionId, answeredAt },
  });
}

// Conditional UPDATE: only rows still in `fromStatus` are affected, so two
// concurrent submits (or a submit racing the lazy-finalize sweep) can't both
// "win" — the loser's updateMany affects 0 rows instead of double-grading.
export function finalizeAttemptIfStillInStatus(
  attemptId: string,
  fromStatus: AttemptStatus,
  data: { status: AttemptStatus; score: Prisma.Decimal; submittedAt: Date },
) {
  return prisma.attempt.updateMany({ where: { id: attemptId, status: fromStatus }, data });
}
