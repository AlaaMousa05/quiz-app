import { Decimal } from "../repositories/decimal.js";
import { sumPoints } from "./scoring.service.js";
import { type Clock, systemClock } from "./clock.js";
import { isWithinGracePeriod, persistScoreIfStillInProgress, resolveAttemptOnRead, toNegMarking, toScoringQuestions } from "./attempt.service.js";
import { getQuizForResults, findQuizForTeacher, type QuizForResults } from "../repositories/quiz.repository.js";
import { ForbiddenError, NotFoundError } from "../errors/index.js";

type AttemptRow = QuizForResults["attempts"][number];
type StudentStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "AUTO_FINALIZED";

interface ResolvedAttempt {
  studentId: string;
  status: StudentStatus;
  score: Decimal | null;
  answers: AttemptRow["answers"];
}

export interface StudentResult {
  studentId: string;
  name: string;
  status: StudentStatus;
  score?: number;
}

export interface ResultsResponse {
  classAverage: number;
  maxPoints: number;
  perQuestionPctCorrect: Array<{ questionId: string; pctCorrect: number }>;
  students: StudentResult[];
}

// An attempt whose deadline+grace has already passed but was never
// individually read (so lazy finalization — attempt.service.ts — never
// fired) would otherwise show as stale "IN_PROGRESS" on the results screen;
// resolve and persist it here too, so a teacher checking results always sees
// the true state without depending on the student re-opening the attempt.
async function resolveForResults(attempt: AttemptRow, quiz: QuizForResults, clock: Clock): Promise<ResolvedAttempt> {
  if (attempt.status !== "IN_PROGRESS") {
    return { studentId: attempt.studentId, status: attempt.status, score: attempt.score, answers: attempt.answers };
  }

  const now = clock.now();
  if (isWithinGracePeriod(now, attempt.deadlineAt)) {
    return { studentId: attempt.studentId, status: "IN_PROGRESS", score: null, answers: attempt.answers };
  }

  const resolved = resolveAttemptOnRead(
    {
      status: attempt.status,
      deadlineAt: attempt.deadlineAt,
      questions: toScoringQuestions(quiz.questions),
      answers: attempt.answers,
      negMarking: toNegMarking(quiz),
    },
    now,
  );
  if (resolved.status === "IN_PROGRESS" || resolved.score === null) {
    return { studentId: attempt.studentId, status: "IN_PROGRESS", score: null, answers: attempt.answers };
  }
  await persistScoreIfStillInProgress(attempt.id, "AUTO_FINALIZED", resolved.score, attempt.deadlineAt);
  return { studentId: attempt.studentId, status: "AUTO_FINALIZED", score: resolved.score, answers: attempt.answers };
}

function isFinalized(status: StudentStatus): status is "SUBMITTED" | "AUTO_FINALIZED" {
  return status === "SUBMITTED" || status === "AUTO_FINALIZED";
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function getResults(quizId: string, clock: Clock = systemClock): Promise<ResultsResponse> {
  const quiz = await getQuizForResults(quizId);
  if (!quiz) {
    throw new NotFoundError("Quiz not found.");
  }

  const rosterStudents = quiz.classes.flatMap((qc) => qc.class.students);
  const uniqueStudents = Array.from(new Map(rosterStudents.map((s) => [s.id, s])).values());
  const resolvedAttempts = await Promise.all(quiz.attempts.map((attempt) => resolveForResults(attempt, quiz, clock)));
  const resolvedByStudentId = new Map(resolvedAttempts.map((r) => [r.studentId, r]));

  const students: StudentResult[] = uniqueStudents.map((student) => {
    const resolved = resolvedByStudentId.get(student.id);
    if (!resolved) {
      return { studentId: student.id, name: student.name, status: "NOT_STARTED" };
    }
    const score = isFinalized(resolved.status) && resolved.score ? resolved.score.toNumber() : undefined;
    return { studentId: student.id, name: student.name, status: resolved.status, score };
  });

  const finalizedScores = students.map((s) => s.score).filter((score): score is number => score !== undefined);
  const classAverage = finalizedScores.length > 0 ? finalizedScores.reduce((a, b) => a + b, 0) / finalizedScores.length : 0;

  const finalizedAttempts = resolvedAttempts.filter((r) => isFinalized(r.status));
  const perQuestionPctCorrect = quiz.questions.map((q) => {
    // question.schema.ts (T063) enforces exactly one correct option.
    const correctOptionId = q.options.find((o) => o.isCorrect)!.id;
    const correctCount = finalizedAttempts.filter((r) => r.answers.some((a) => a.questionId === q.id && a.optionId === correctOptionId)).length;
    return { questionId: q.id, pctCorrect: finalizedAttempts.length > 0 ? Math.round((correctCount / finalizedAttempts.length) * 100) : 0 };
  });

  return { classAverage: roundTo2(classAverage), maxPoints: sumPoints(quiz.questions).toNumber(), perQuestionPctCorrect, students };
}

export async function getResultsForTeacher(quizId: string, teacherId: string, clock: Clock = systemClock) {
  const quiz = await findQuizForTeacher(quizId, teacherId);
  if (!quiz) {
    throw new ForbiddenError("You don't own this quiz.");
  }
  return getResults(quizId, clock);
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toResultsCsv(results: ResultsResponse): string {
  const header = "Name,Status,Score\n";
  const rows = results.students.map((s) => `${csvEscape(s.name)},${s.status},${s.score ?? ""}`).join("\n");
  return `${header}${rows}\nClass average,,${results.classAverage}\n`;
}
