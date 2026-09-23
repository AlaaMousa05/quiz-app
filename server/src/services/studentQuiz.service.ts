import { sumPoints } from "./scoring.service.js";
import { type Clock, systemClock } from "./clock.js";
import type { AttemptStatus } from "./attempt.service.js";
import { findAttemptByQuizAndStudent, findAttemptsByStudentAndQuizIds } from "../repositories/attempt.repository.js";
import { findPublishedQuizForClass, listPublishedQuizzesForClass } from "../repositories/quiz.repository.js";
import { NotFoundError } from "../errors/index.js";

type QuizBucket = "open" | "upcoming" | "done";

function classifyBucket(opensAt: Date, closesAt: Date, attemptStatus: AttemptStatus | undefined, now: Date): QuizBucket {
  if (now < opensAt) return "upcoming";
  if ((attemptStatus && attemptStatus !== "IN_PROGRESS") || now > closesAt) return "done";
  return "open";
}

export async function listQuizzesForStudent(studentId: string, classId: string, clock: Clock = systemClock) {
  const quizzes = await listPublishedQuizzesForClass(classId);
  const now = clock.now();

  // One query for every quiz's attempt (if any), instead of one findUnique
  // per quiz.
  const attempts = await findAttemptsByStudentAndQuizIds(
    studentId,
    quizzes.map((q) => q.id),
  );
  const attemptByQuizId = new Map(attempts.map((a) => [a.quizId, a]));

  const summaries = quizzes.map((quiz) => {
    const attempt = attemptByQuizId.get(quiz.id);
    return {
      bucket: classifyBucket(quiz.opensAt, quiz.closesAt, attempt?.status, now),
      summary: {
        id: quiz.id,
        title: quiz.title,
        classNames: quiz.classes.map((qc) => qc.class.name),
        timeLimitMinutes: quiz.timeLimitMinutes,
        opensAt: quiz.opensAt.toISOString(),
        closesAt: quiz.closesAt.toISOString(),
        hasAttempt: attempt !== undefined,
        attemptStatus: attempt?.status,
      },
    };
  });

  return {
    open: summaries.filter((s) => s.bucket === "open").map((s) => s.summary),
    upcoming: summaries.filter((s) => s.bucket === "upcoming").map((s) => s.summary),
    done: summaries.filter((s) => s.bucket === "done").map((s) => s.summary),
  };
}

export async function getQuizIntro(quizId: string, studentId: string, classId: string) {
  const quiz = await findPublishedQuizForClass(quizId, classId);
  if (!quiz) {
    throw new NotFoundError("Quiz not found.");
  }
  const attempt = await findAttemptByQuizAndStudent(quizId, studentId);

  return {
    id: quiz.id,
    title: quiz.title,
    timeLimitMinutes: quiz.timeLimitMinutes,
    totalPoints: sumPoints(quiz.questions).toNumber(),
    questionCount: quiz.questions.length,
    negMarkEnabled: quiz.negMarkEnabled,
    negMarkPenalty: quiz.negMarkPenalty.toNumber(),
    opensAt: quiz.opensAt.toISOString(),
    closesAt: quiz.closesAt.toISOString(),
    hasAttempt: attempt !== null,
    attemptId: attempt?.id,
  };
}
