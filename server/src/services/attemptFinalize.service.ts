import { Decimal } from "../repositories/decimal.js";
import { sumPoints } from "./scoring.service.js";
import { type Clock, systemClock } from "./clock.js";
import {
  answerMapOf,
  isWithinGracePeriod,
  persistScoreIfStillInProgress,
  requireOwnAttempt,
  resolveAttemptOnRead,
  toNegMarking,
  toScoringQuestions,
} from "./attempt.service.js";
import { findAttemptById, type AttemptWithQuiz } from "../repositories/attempt.repository.js";
import { ConflictError, ForbiddenError } from "../errors/index.js";

// If the attempt is still IN_PROGRESS and its deadline + grace has fully
// elapsed, persists the auto-finalized score (FR-009) through the same
// conditional UPDATE submitAttempt uses, so a concurrent submit/read can't
// double-grade it. Returns the authoritative score/submittedAt either way.
async function finalizeIfExpired(
  attempt: AttemptWithQuiz,
  now: Date,
): Promise<{ score: Decimal; submittedAt: Date | null }> {
  if (attempt.status !== "IN_PROGRESS") {
    return { score: attempt.score ?? new Decimal(0), submittedAt: attempt.submittedAt };
  }

  const resolved = resolveAttemptOnRead(
    {
      status: attempt.status,
      deadlineAt: attempt.deadlineAt,
      questions: toScoringQuestions(attempt.quiz.questions),
      answers: attempt.answers,
      negMarking: toNegMarking(attempt.quiz),
    },
    now,
  );
  if (resolved.status === "IN_PROGRESS") {
    throw new ConflictError("This attempt hasn't been submitted yet.");
  }

  // resolveAttemptOnRead only returns a null score for status "IN_PROGRESS",
  // already handled above, so `resolved.score` is guaranteed set here.
  const finalScore = resolved.score!;
  const won = await persistScoreIfStillInProgress(attempt.id, "AUTO_FINALIZED", finalScore, attempt.deadlineAt);
  if (!won) {
    // A concurrent request finalized it first — re-read the authoritative
    // row. It's guaranteed to exist (we just read it) and to have a score
    // (whoever won the race set one via this same conditional update, or via
    // submitAttempt's equivalent).
    const refreshed = (await findAttemptById(attempt.id))!;
    return { score: refreshed.score!, submittedAt: refreshed.submittedAt };
  }

  return { score: finalScore, submittedAt: attempt.deadlineAt };
}

function reviewQuestion(question: AttemptWithQuiz["quiz"]["questions"][number], selectedOptionId: string | null) {
  // question.schema.ts (T063) enforces exactly one correct option per
  // question at write time, so `find` here always succeeds.
  const correctOption = question.options.find((o) => o.isCorrect)!;
  const pointsAwarded = selectedOptionId === correctOption.id ? question.points.toNumber() : 0;
  return {
    id: question.id,
    text: question.text,
    points: question.points.toNumber(),
    // Client needs option text (not just ids) to render "Your answer: B. 3"
    // — order is preserved (orderIndex, already applied by the repository's
    // include) so the client can derive the A/B/C/D letter from position.
    options: question.options.map((o) => ({ id: o.id, text: o.text })),
    selectedOptionId,
    correctOptionId: correctOption.id,
    pointsAwarded,
  };
}

export async function getAttemptResult(attemptId: string, studentId: string, clock: Clock = systemClock) {
  const attempt = await requireOwnAttempt(attemptId, studentId);
  const { score, submittedAt } = await finalizeIfExpired(attempt, clock.now());

  return {
    score: score.toNumber(),
    maxPoints: sumPoints(attempt.quiz.questions).toNumber(),
    submittedAt: submittedAt ? submittedAt.toISOString() : null,
    quizClosesAt: attempt.quiz.closesAt.toISOString(),
  };
}

export async function getAttemptReview(attemptId: string, studentId: string, clock: Clock = systemClock) {
  const attempt = await requireOwnAttempt(attemptId, studentId);
  const now = clock.now();
  if (now < attempt.quiz.closesAt) {
    throw new ForbiddenError("Review is available once the quiz has closed.");
  }
  // The quiz has closed, but if this attempt is still IN_PROGRESS and within
  // its own grace window, it could still be legitimately submitted (save and
  // submit both honor that window) — reveal nothing until that possibility
  // has passed, rather than letting finalizeIfExpired's internal "not
  // submitted yet" ConflictError leak out as an undocumented 409 (the
  // contract only specifies 403 for this endpoint).
  if (attempt.status === "IN_PROGRESS" && isWithinGracePeriod(now, attempt.deadlineAt)) {
    throw new ForbiddenError("Review isn't available yet — this attempt may still be submitted.");
  }

  // The answers scored are exactly the ones already loaded on `attempt` (a
  // concurrent submit would score that same snapshot), so the breakdown
  // below can reuse it instead of re-fetching the whole attempt+quiz tree.
  const { score } = await finalizeIfExpired(attempt, now);
  const answerByQuestionId = answerMapOf(attempt.answers);

  return {
    score: score.toNumber(),
    maxPoints: sumPoints(attempt.quiz.questions).toNumber(),
    questions: attempt.quiz.questions.map((q) => reviewQuestion(q, answerByQuestionId.get(q.id) ?? null)),
  };
}
