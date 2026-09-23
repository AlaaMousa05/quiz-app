import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { prisma } from "../../src/repositories/prismaClient.js";
import { questionsWithOptionsInclude } from "../../src/repositories/quiz.repository.js";

const { Decimal } = Prisma;

// Shared by attempt-lifecycle tests (unit clock/deadline logic lives in
// attempt.service.test.ts; these helpers back the real-Postgres integration
// tests in student-quizzes.routes.test.ts). Kept here because both files need
// the same "class + student + quiz + questions" shape (CLAUDE.md: no
// abstraction without a second use — this is the second use).

export async function createClass(name: string) {
  return prisma.class.create({ data: { name } });
}

async function createUser(opts: {
  username: string;
  password: string;
  role: "STUDENT" | "TEACHER";
  classId?: string;
}) {
  const passwordHash = await bcrypt.hash(opts.password, 12);
  const user = await prisma.user.create({
    data: {
      role: opts.role,
      name: opts.username,
      nameNormalized: opts.username.toLowerCase(),
      username: opts.username,
      passwordHash,
      classId: opts.classId,
    },
  });
  return { ...user, password: opts.password };
}

export function createStudent(opts: { username: string; classId: string; password?: string }) {
  return createUser({ role: "STUDENT", username: opts.username, classId: opts.classId, password: opts.password ?? "correct-horse" });
}

export function createTeacher(username: string, password = "correct-horse") {
  return createUser({ role: "TEACHER", username, password });
}

export interface QuestionFixture {
  points: number;
  options: Array<{ text: string; isCorrect: boolean }>;
}

export function fourOptionQuestion(points: number, correctIndex: 0 | 1 | 2 | 3 = 0): QuestionFixture {
  return {
    points,
    options: ["A", "B", "C", "D"].map((text, i) => ({ text, isCorrect: i === correctIndex })),
  };
}

export async function createQuiz(opts: {
  ownerTeacherId: string;
  classIds: string[];
  opensAt: Date;
  closesAt: Date;
  timeLimitMinutes?: number;
  negMarkEnabled?: boolean;
  negMarkPenalty?: number;
  status?: "DRAFT" | "PUBLISHED";
  questions: QuestionFixture[];
}) {
  const quiz = await prisma.quiz.create({
    data: {
      title: "Fixture quiz",
      ownerTeacherId: opts.ownerTeacherId,
      status: opts.status ?? "PUBLISHED",
      opensAt: opts.opensAt,
      closesAt: opts.closesAt,
      timeLimitMinutes: opts.timeLimitMinutes ?? 20,
      negMarkEnabled: opts.negMarkEnabled ?? false,
      negMarkPenalty: new Decimal(opts.negMarkPenalty ?? 0),
      classes: { create: opts.classIds.map((classId) => ({ classId })) },
      questions: {
        create: opts.questions.map((q, i) => ({
          text: `Question ${i + 1}`,
          points: new Decimal(q.points),
          orderIndex: i,
          options: {
            create: q.options.map((o, j) => ({ text: o.text, isCorrect: o.isCorrect, orderIndex: j })),
          },
        })),
      },
    },
    include: { questions: questionsWithOptionsInclude },
  });
  return quiz;
}

// Bypasses the "start" endpoint to plant an Attempt in a known time state
// (e.g. deadline already 30s in the past) — real DB row, just not created via
// the timing-sensitive HTTP path, so grace/expiry tests don't depend on
// wall-clock sleeps.
export async function plantAttempt(opts: {
  quizId: string;
  studentId: string;
  startedAt: Date;
  deadlineAt: Date;
  status?: "IN_PROGRESS" | "SUBMITTED" | "AUTO_FINALIZED";
  score?: number | null;
  submittedAt?: Date | null;
}) {
  return prisma.attempt.create({
    data: {
      quizId: opts.quizId,
      studentId: opts.studentId,
      startedAt: opts.startedAt,
      deadlineAt: opts.deadlineAt,
      status: opts.status ?? "IN_PROGRESS",
      score: opts.score === undefined || opts.score === null ? null : new Decimal(opts.score),
      submittedAt: opts.submittedAt ?? null,
    },
  });
}

export async function saveAnswerDirect(attemptId: string, questionId: string, optionId: string | null) {
  return prisma.answer.create({ data: { attemptId, questionId, optionId } });
}

export function secondsAgo(n: number): Date {
  return new Date(Date.now() - n * 1000);
}

export function secondsFromNow(n: number): Date {
  return new Date(Date.now() + n * 1000);
}
