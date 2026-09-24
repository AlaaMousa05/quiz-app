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

// --- Teacher-authoring write paths (T063) ---

export interface QuizSettingsData {
  title?: string;
  classIds?: string[];
  opensAt?: Date;
  closesAt?: Date;
  timeLimitMinutes?: number;
  negMarkEnabled?: boolean;
  negMarkPenalty?: Prisma.Decimal;
}

export function createQuizForTeacher(ownerTeacherId: string, data: Required<QuizSettingsData>) {
  return prisma.quiz.create({
    data: {
      title: data.title,
      ownerTeacherId,
      opensAt: data.opensAt,
      closesAt: data.closesAt,
      timeLimitMinutes: data.timeLimitMinutes,
      negMarkEnabled: data.negMarkEnabled,
      negMarkPenalty: data.negMarkPenalty,
      classes: { create: data.classIds.map((classId) => ({ classId })) },
    },
  });
}

// Ownership is baked into the query (not checked after the fact) so a
// non-owner's request reads as "not found" — the caller maps null to 403
// without leaking whether the quiz exists (Principle III).
export function findQuizForTeacher(quizId: string, teacherId: string): Promise<QuizWithQuestions | null> {
  return prisma.quiz.findFirst({ where: { id: quizId, ownerTeacherId: teacherId }, include: quizWithQuestionsInclude });
}

export function listQuizzesForTeacher(teacherId: string) {
  return prisma.quiz.findMany({
    where: { ownerTeacherId: teacherId },
    include: {
      classes: { include: { class: { include: { _count: { select: { students: true } } } } } },
      _count: { select: { attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function isQuizLocked(quizId: string): Promise<boolean> {
  const attemptCount = await prisma.attempt.count({ where: { quizId } });
  return attemptCount > 0;
}

// `classIds`, if present, replaces the quiz's class assignments entirely —
// simpler than diffing add/remove, and settings updates are infrequent.
export function updateQuiz(quizId: string, data: QuizSettingsData) {
  const { classIds, ...scalarFields } = data;
  return prisma.$transaction(async (tx) => {
    if (classIds) {
      await tx.quizClass.deleteMany({ where: { quizId } });
      await tx.quizClass.createMany({ data: classIds.map((classId) => ({ quizId, classId })) });
    }
    return tx.quiz.update({ where: { id: quizId }, data: scalarFields });
  });
}

export function setQuizStatus(quizId: string, status: "DRAFT" | "PUBLISHED") {
  return prisma.quiz.update({ where: { id: quizId }, data: { status } });
}

export function countQuestions(quizId: string) {
  return prisma.question.count({ where: { quizId } });
}

export function findQuestionForQuiz(quizId: string, questionId: string) {
  return prisma.question.findFirst({ where: { id: questionId, quizId }, include: { options: true } });
}

export interface QuestionData {
  text: string;
  points: Prisma.Decimal;
  options: Array<{ text: string; isCorrect: boolean }>;
}

export async function createQuestion(quizId: string, data: QuestionData) {
  const orderIndex = await countQuestions(quizId);
  return prisma.question.create({
    data: {
      quizId,
      text: data.text,
      points: data.points,
      orderIndex,
      options: { create: data.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, orderIndex: i })) },
    },
    include: { options: true },
  });
}

// Options are replaced wholesale on update — simpler than diffing, and safe
// here because a question can only be edited while its quiz is unlocked
// (zero attempts, so zero Answer rows can reference the options being
// replaced).
export function updateQuestion(questionId: string, data: QuestionData) {
  return prisma.$transaction(async (tx) => {
    await tx.option.deleteMany({ where: { questionId } });
    return tx.question.update({
      where: { id: questionId },
      data: {
        text: data.text,
        points: data.points,
        options: { create: data.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, orderIndex: i })) },
      },
      include: { options: true },
    });
  });
}

// Same shape as listQuizzesForTeacher, unfiltered by owner, plus the owner's
// name (A6 shows it; a teacher's own list doesn't need to) — contracts/admin-scope.md.
export function listAllQuizzesForAdmin() {
  return prisma.quiz.findMany({
    include: {
      classes: { include: { class: { include: { _count: { select: { students: true } } } } } },
      _count: { select: { attempts: true } },
      ownerTeacher: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function getQuizForResults(quizId: string) {
  return prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      ownerTeacher: { select: { name: true } },
      questions: questionsWithOptionsInclude,
      classes: { include: { class: { include: { students: true } } } },
      attempts: { include: { answers: true } },
    },
  });
}

export type QuizForResults = NonNullable<Awaited<ReturnType<typeof getQuizForResults>>>;

export function deleteQuestion(questionId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.option.deleteMany({ where: { questionId } });
    await tx.question.delete({ where: { id: questionId } });
  });
}
