import { Decimal } from "../repositories/decimal.js";

export interface ScoringQuestion {
  id: string;
  points: Decimal;
  correctOptionId: string;
  optionIds: string[];
}

export interface ScoringAnswer {
  questionId: string;
  optionId: string | null;
}

export interface NegativeMarkingConfig {
  enabled: boolean;
  penalty: Decimal;
}

// Pre-floor total (FR-012). Exposed separately from scoreAttempt so callers
// that need the unfloored per-question breakdown (e.g. the post-close review
// screen) don't have to re-derive it, and so precision can be asserted
// directly without the floor masking a wrong intermediate value.
export function computeRawScore(
  questions: ScoringQuestion[],
  answers: ScoringAnswer[],
  negMarking: NegativeMarkingConfig,
): Decimal {
  const answerByQuestionId = new Map(answers.map((a) => [a.questionId, a]));

  return questions.reduce((total, question) => {
    const optionId = answerByQuestionId.get(question.id)?.optionId ?? null;

    // Unanswered, or an optionId that doesn't belong to this question (a
    // tampered/foreign request per CLAUDE.md's non-negotiable rules) both
    // score 0 rather than being counted as a wrong answer.
    if (optionId === null || !question.optionIds.includes(optionId)) {
      return total;
    }

    if (optionId === question.correctOptionId) {
      return total.plus(question.points);
    }

    if (!negMarking.enabled) {
      return total;
    }

    return total.minus(negMarking.penalty.times(question.points));
  }, new Decimal(0));
}

// Publicly-visible attempt score: the raw total floored at zero (FR-012b).
export function scoreAttempt(
  questions: ScoringQuestion[],
  answers: ScoringAnswer[],
  negMarking: NegativeMarkingConfig,
): Decimal {
  return Decimal.max(0, computeRawScore(questions, answers, negMarking));
}

// Shared by every place that needs a quiz/attempt's max achievable points
// (attempt.service, attemptFinalize.service, studentQuiz.service) — takes
// anything with a `points` field so callers don't need to reshape into
// ScoringQuestion[] first.
export function sumPoints(questions: Array<{ points: Decimal }>): Decimal {
  return questions.reduce((total, q) => total.plus(q.points), new Decimal(0));
}
