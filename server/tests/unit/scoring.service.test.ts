import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { scoreAttempt } from "../../src/services/scoring.service.js";
import type { ScoringAnswer, ScoringQuestion } from "../../src/services/scoring.service.js";
import { answer, Q1, Q2, Q3 } from "./scoring.service.fixtures.js";

const { Decimal } = Prisma;

/**
 * Every case's expected total is written out with the per-question arithmetic
 * in its `name`, so it can be checked by hand against FR-012/FR-012b:
 *   correct     -> + points
 *   wrong       -> - (penalty * points), only when negMarkEnabled
 *   unanswered  -> 0, always, regardless of negMarkEnabled
 *   total       -> floored at 0
 */
// questions defaults to [Q1, Q2, Q3]; only overridden where a case needs a
// different quiz shape (e.g. a single-question quiz).
const cases: Array<{
  name: string;
  questions?: ScoringQuestion[];
  answers: ScoringAnswer[];
  negMarkEnabled: boolean;
  penalty: number;
  expectedTotal: number;
}> = [
  {
    name: "all correct, no negative marking: 10 + 20 + 4 = 34",
    answers: [answer("q1", "A"), answer("q2", "B"), answer("q3", "C")],
    negMarkEnabled: false,
    penalty: 0.25,
    expectedTotal: 34,
  },
  {
    name: "all correct, negative marking enabled (no wrong answers to penalize): 10 + 20 + 4 = 34",
    answers: [answer("q1", "A"), answer("q2", "B"), answer("q3", "C")],
    negMarkEnabled: true,
    penalty: 0.25,
    expectedTotal: 34,
  },
  {
    name: "one wrong, negative marking disabled: wrong scores 0 -> 0 + 20 + 4 = 24",
    answers: [answer("q1", "D"), answer("q2", "B"), answer("q3", "C")],
    negMarkEnabled: false,
    penalty: 0.25,
    expectedTotal: 24,
  },
  {
    name: "one wrong, negative marking enabled penalty 0.25: -(0.25*10) + 20 + 4 = -2.5 + 20 + 4 = 21.5",
    answers: [answer("q1", "D"), answer("q2", "B"), answer("q3", "C")],
    negMarkEnabled: true,
    penalty: 0.25,
    expectedTotal: 21.5,
  },
  {
    name: "unanswered question always scores 0 even with negative marking enabled: 0 + 20 + -(0.25*4) = 0 + 20 - 1 = 19",
    answers: [answer("q1", null), answer("q2", "B"), answer("q3", "D")],
    negMarkEnabled: true,
    penalty: 0.25,
    expectedTotal: 19,
  },
  {
    name: "all wrong, negative marking enabled penalty 0.25, total floors at 0: -(2.5) + -(5) + -(1) = -8.5 -> floored to 0",
    answers: [answer("q1", "D"), answer("q2", "D"), answer("q3", "D")],
    negMarkEnabled: true,
    penalty: 0.25,
    expectedTotal: 0,
  },
  {
    name: "single question wrong, penalty fraction 1.0 (full deduction): -(1.0*10) = -10 -> floored to 0",
    questions: [Q1],
    answers: [answer("q1", "D")],
    negMarkEnabled: true,
    penalty: 1.0,
    expectedTotal: 0,
  },
  {
    name: "penalty fraction 0.5: -(0.5*10) + 20 + -(0.5*4) = -5 + 20 - 2 = 13",
    answers: [answer("q1", "D"), answer("q2", "B"), answer("q3", "D")],
    negMarkEnabled: true,
    penalty: 0.5,
    expectedTotal: 13,
  },
  {
    name: "negative marking enabled but penalty fraction 0.0: wrong still scores 0, same as disabled: -(0*10) + 20 + 0(unanswered) = 20",
    answers: [answer("q1", "D"), answer("q2", "B"), answer("q3", null)],
    negMarkEnabled: true,
    penalty: 0,
    expectedTotal: 20,
  },
  {
    name: "all unanswered, negative marking enabled: 0 + 0 + 0 = 0",
    answers: [answer("q1", null), answer("q2", null), answer("q3", null)],
    negMarkEnabled: true,
    penalty: 0.25,
    expectedTotal: 0,
  },
];

describe("scoring.spec: negative-marking penalty applies configured fraction of question points", () => {
  it.each(cases)("$name", ({ questions = [Q1, Q2, Q3], answers, negMarkEnabled, penalty, expectedTotal }) => {
    const total = scoreAttempt(questions, answers, {
      enabled: negMarkEnabled,
      penalty: new Decimal(penalty),
    });

    expect(total.toNumber()).toBe(expectedTotal);
    // scoring.spec: total score floors at zero (FR-012b) — true for every case above.
    expect(total.isNegative()).toBe(false);
  });
});

describe("scoring.spec: total score floors at zero", () => {
  it("never floors a positive total", () => {
    const total = scoreAttempt([Q1], [answer("q1", "A")], {
      enabled: true,
      penalty: new Decimal(1),
    });

    expect(total.toNumber()).toBe(10);
  });
});

describe("scoring.spec: score shown immediately after submit (score computation)", () => {
  it("returns a single Decimal total, computed synchronously from questions + answers + config, matching FR-012/FR-012b", () => {
    const total = scoreAttempt(
      [Q1, Q2, Q3],
      [answer("q1", "A"), answer("q2", "D"), answer("q3", null)],
      { enabled: true, penalty: new Decimal(0.25) },
    );

    // Q1 correct: +10, Q2 wrong: -(0.25*20) = -5, Q3 unanswered: 0 -> 10 - 5 + 0 = 5
    expect(total.toNumber()).toBe(5);
  });
});
