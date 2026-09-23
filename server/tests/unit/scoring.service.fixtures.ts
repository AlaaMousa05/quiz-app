import { Prisma } from "@prisma/client";
import type { ScoringAnswer, ScoringQuestion } from "../../src/services/scoring.service.js";

const { Decimal } = Prisma;

// Three questions shared by scoring.service.test.ts and
// scoring.service.edge-cases.test.ts, unless a case says otherwise:
//   Q1 = 10 points, correct option "A", other valid option "D"
//   Q2 = 20 points, correct option "B", other valid option "D"
//   Q3 = 4 points,  correct option "C", other valid option "D"
export const Q1: ScoringQuestion = { id: "q1", points: new Decimal(10), correctOptionId: "A", optionIds: ["A", "D"] };
export const Q2: ScoringQuestion = { id: "q2", points: new Decimal(20), correctOptionId: "B", optionIds: ["B", "D"] };
export const Q3: ScoringQuestion = { id: "q3", points: new Decimal(4), correctOptionId: "C", optionIds: ["C", "D"] };

export function answer(questionId: string, optionId: string | null): ScoringAnswer {
  return { questionId, optionId };
}
