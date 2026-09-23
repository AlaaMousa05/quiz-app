import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { computeRawScore, scoreAttempt } from "../../src/services/scoring.service.js";
import type { ScoringQuestion } from "../../src/services/scoring.service.js";
import { answer, Q1, Q2, Q3 } from "./scoring.service.fixtures.js";

const { Decimal } = Prisma;

describe("scoring.spec: Decimal precision is exact, not float-approximate (FR-012b)", () => {
  it("case 13: three 1-point questions, all wrong, penalty 0.25 -> raw sum is exactly -0.75, not -0.7499999999...", () => {
    const onePointQuestion = (id: string): ScoringQuestion => ({
      id,
      points: new Decimal(1),
      correctOptionId: "correct",
      optionIds: ["correct", "wrong"],
    });
    const questions = [onePointQuestion("p1"), onePointQuestion("p2"), onePointQuestion("p3")];
    const answers = [answer("p1", "wrong"), answer("p2", "wrong"), answer("p3", "wrong")];
    const config = { enabled: true, penalty: new Decimal(0.25) };

    // Raw, pre-floor total: -(0.25*1) + -(0.25*1) + -(0.25*1) = -0.75 exactly.
    const raw = computeRawScore(questions, answers, config);
    expect(raw.equals(new Decimal("-0.75"))).toBe(true);
    expect(raw.toString()).toBe("-0.75");

    // scoreAttempt still floors the publicly-visible total at 0 (FR-012b).
    expect(scoreAttempt(questions, answers, config).toNumber()).toBe(0);
  });
});

describe("scoring.spec: an answer's optionId must belong to its own question", () => {
  it("case 14: an optionId belonging to a different question is ignored, not scored as correct or wrong", () => {
    const questionA: ScoringQuestion = {
      id: "qa",
      points: new Decimal(10),
      correctOptionId: "ca-1",
      optionIds: ["ca-1", "ca-2", "ca-3", "ca-4"],
    };
    const questionB: ScoringQuestion = {
      id: "qb",
      points: new Decimal(10),
      correctOptionId: "cb-1",
      optionIds: ["cb-1", "cb-2", "cb-3", "cb-4"],
    };
    // qa's answer references "cb-2", an option that belongs to qb, not qa.
    const answers = [answer("qa", "cb-2"), answer("qb", "cb-1")];
    const config = { enabled: true, penalty: new Decimal(0.25) };

    // If the foreign optionId were wrongly treated as a wrong answer, qa would
    // contribute -(0.25*10) = -2.5 and the total would be 7.5, not 10.
    const total = scoreAttempt([questionA, questionB], answers, config);
    expect(total.toNumber()).toBe(10);
  });
});

describe("scoring.spec: unanswered questions never throw, whether the key is missing or explicit null", () => {
  const twoQuestions = [Q1, Q2];

  it("case 15a: a question with no answer entry at all scores 0 and does not throw", () => {
    const answers = [answer("q2", "B")]; // q1 has no entry in the answers array

    const total = scoreAttempt(twoQuestions, answers, { enabled: true, penalty: new Decimal(0.25) });
    expect(total.toNumber()).toBe(20);
  });

  it("case 15b: a question with an explicit null optionId scores the same as a missing entry", () => {
    const answers = [answer("q1", null), answer("q2", "B")];

    const total = scoreAttempt(twoQuestions, answers, { enabled: true, penalty: new Decimal(0.25) });
    expect(total.toNumber()).toBe(20);
  });
});

describe("scoring.spec: negative marking off never zeroes out a correct answer", () => {
  it("case 16: one correct, one wrong, one unanswered, negative marking off -> only the correct answer scores", () => {
    const total = scoreAttempt(
      [Q1, Q2, Q3],
      [answer("q1", "A"), answer("q2", "D"), answer("q3", null)],
      { enabled: false, penalty: new Decimal(0.25) },
    );

    // Q1 correct: +10, Q2 wrong (off -> 0), Q3 unanswered: 0 -> 10
    expect(total.toNumber()).toBe(10);
  });
});
