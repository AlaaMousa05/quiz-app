import { Decimal } from "../repositories/decimal.js";
import type { NegativeMarkingConfig, ScoringAnswer, ScoringQuestion } from "./scoring.service.js";
import { scoreAttempt, sumPoints } from "./scoring.service.js";
import { type Clock, systemClock } from "./clock.js";
import {
  createAttempt,
  finalizeAttemptIfStillInStatus,
  findAttemptById,
  upsertAnswer,
  type AttemptWithQuiz,
} from "../repositories/attempt.repository.js";
import { findPublishedQuizForClass } from "../repositories/quiz.repository.js";
import { AttemptAlreadyFinalizedError, DeadlinePassedError, ForbiddenError, NotFoundError, ValidationError } from "../errors/index.js";

export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "AUTO_FINALIZED";

export const GRACE_PERIOD_MS = 10_000;

// --- Pure timing/deadline logic (attempt.spec) — no DB, driven entirely by
// the Date values passed in, so the unit suite can exercise every boundary
// without a real or mocked clock. ---

export function computeDeadlineAt(startedAt: Date, timeLimitMinutes: number, closesAt: Date): Date {
  const byTimeLimit = new Date(startedAt.getTime() + timeLimitMinutes * 60_000);
  return byTimeLimit < closesAt ? byTimeLimit : closesAt;
}

export function isWithinGracePeriod(now: Date, deadlineAt: Date): boolean {
  return now.getTime() - deadlineAt.getTime() <= GRACE_PERIOD_MS;
}

// Grace never applies here: a quiz that has closed cannot be started, even a
// few seconds into what would be the save/submit grace window (FR-008).
export function canStartAttempt(now: Date, opensAt: Date, closesAt: Date): boolean {
  return now >= opensAt && now <= closesAt;
}

export interface AttemptFinalizationInput {
  status: AttemptStatus;
  deadlineAt: Date;
  questions: ScoringQuestion[];
  answers: ScoringAnswer[];
  negMarking: NegativeMarkingConfig;
}

export interface AttemptFinalizationResult {
  status: AttemptStatus;
  score: Decimal | null;
}

// Lazy finalization (FR-009): a terminal attempt, or one still within its
// grace window, is returned unchanged; only once the grace has fully elapsed
// does this compute (and the caller persist) the final score.
export function resolveAttemptOnRead(input: AttemptFinalizationInput, now: Date): AttemptFinalizationResult {
  if (input.status !== "IN_PROGRESS" || isWithinGracePeriod(now, input.deadlineAt)) {
    return { status: input.status, score: null };
  }
  return { status: "AUTO_FINALIZED", score: scoreAttempt(input.questions, input.answers, input.negMarking) };
}

// --- Attempt state-machine (start / resume / autosave / submit). Read +
// lazy-finalize flows (result/review) live in attemptFinalize.service.ts to
// keep this file under the file-size guideline. ---

export function toScoringQuestions(questions: AttemptWithQuiz["quiz"]["questions"]): ScoringQuestion[] {
  return questions.map((q) => ({
    id: q.id,
    points: q.points,
    // question.schema.ts (T063) enforces exactly one correct option per
    // question at write time, so `find` here always succeeds.
    correctOptionId: q.options.find((o) => o.isCorrect)!.id,
    optionIds: q.options.map((o) => o.id),
  }));
}

export function toNegMarking(quiz: AttemptWithQuiz["quiz"]): NegativeMarkingConfig {
  return { enabled: quiz.negMarkEnabled, penalty: quiz.negMarkPenalty };
}

export function answerMapOf(answers: ScoringAnswer[]): Map<string, string | null> {
  return new Map(answers.map((a) => [a.questionId, a.optionId]));
}

// Conditionally persists a terminal transition (SUBMITTED via explicit
// submit, AUTO_FINALIZED via the lazy-finalize sweep in
// attemptFinalize.service.ts) — the one place both paths go through, so a
// concurrent submit and a concurrent finalize-on-read can't both "win"
// against the same IN_PROGRESS row.
export async function persistScoreIfStillInProgress(
  attemptId: string,
  status: Extract<AttemptStatus, "SUBMITTED" | "AUTO_FINALIZED">,
  score: Decimal,
  submittedAt: Date,
): Promise<boolean> {
  const { count } = await finalizeAttemptIfStillInStatus(attemptId, "IN_PROGRESS", { status, score, submittedAt });
  return count > 0;
}

export async function requireOwnAttempt(attemptId: string, studentId: string): Promise<AttemptWithQuiz> {
  const attempt = await findAttemptById(attemptId);
  if (!attempt) {
    throw new NotFoundError("Attempt not found.");
  }
  if (attempt.studentId !== studentId) {
    throw new ForbiddenError("This attempt doesn't belong to you.");
  }
  return attempt;
}

export async function startAttempt(
  quizId: string,
  studentId: string,
  classId: string,
  clock: Clock = systemClock,
): Promise<{ attemptId: string }> {
  const quiz = await findPublishedQuizForClass(quizId, classId);
  if (!quiz) {
    throw new NotFoundError("Quiz not found.");
  }
  const now = clock.now();
  if (!canStartAttempt(now, quiz.opensAt, quiz.closesAt)) {
    throw new ForbiddenError("This quiz isn't open right now.");
  }
  const deadlineAt = computeDeadlineAt(now, quiz.timeLimitMinutes, quiz.closesAt);
  const attempt = await createAttempt({ quizId, studentId, startedAt: now, deadlineAt });
  return { attemptId: attempt.id };
}

export async function getAttemptForResume(attemptId: string, studentId: string, clock: Clock = systemClock) {
  const attempt = await requireOwnAttempt(attemptId, studentId);
  const now = clock.now();
  const remainingSeconds = Math.max(0, Math.round((attempt.deadlineAt.getTime() - now.getTime()) / 1000));
  const answersByQuestionId = answerMapOf(attempt.answers);

  return {
    quizId: attempt.quizId,
    deadlineAt: attempt.deadlineAt.toISOString(),
    remainingSeconds,
    questions: attempt.quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      points: q.points.toNumber(),
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
    })),
    answers: Object.fromEntries(attempt.quiz.questions.map((q) => [q.id, answersByQuestionId.get(q.id) ?? null])),
  };
}

function requireInProgress(attempt: AttemptWithQuiz) {
  if (attempt.status !== "IN_PROGRESS") {
    throw new AttemptAlreadyFinalizedError("This attempt has already been finalized.");
  }
}

export async function saveAnswer(
  attemptId: string,
  studentId: string,
  input: { questionId: string; optionId: string | null },
  clock: Clock = systemClock,
) {
  const attempt = await requireOwnAttempt(attemptId, studentId);
  requireInProgress(attempt);

  const now = clock.now();
  if (!isWithinGracePeriod(now, attempt.deadlineAt)) {
    throw new DeadlinePassedError("The save window for this attempt has closed.");
  }

  const question = attempt.quiz.questions.find((q) => q.id === input.questionId);
  if (!question) {
    throw new ValidationError("This question doesn't belong to this attempt's quiz.");
  }
  if (input.optionId !== null && !question.options.some((o) => o.id === input.optionId)) {
    throw new ValidationError("This option doesn't belong to the given question.");
  }

  const saved = await upsertAnswer(attemptId, input.questionId, input.optionId, now);
  return { savedAt: saved.answeredAt };
}

export async function submitAttempt(attemptId: string, studentId: string, clock: Clock = systemClock) {
  const attempt = await requireOwnAttempt(attemptId, studentId);
  requireInProgress(attempt);

  const now = clock.now();
  if (!isWithinGracePeriod(now, attempt.deadlineAt)) {
    throw new DeadlinePassedError("The submission window for this attempt has closed.");
  }

  const questions = toScoringQuestions(attempt.quiz.questions);
  const score = scoreAttempt(questions, attempt.answers, toNegMarking(attempt.quiz));

  const won = await persistScoreIfStillInProgress(attemptId, "SUBMITTED", score, now);
  if (!won) {
    // Lost the race to a concurrent submit (or the lazy-finalize sweep).
    throw new AttemptAlreadyFinalizedError("This attempt has already been finalized.");
  }

  return { score: score.toNumber(), maxPoints: sumPoints(questions).toNumber() };
}
