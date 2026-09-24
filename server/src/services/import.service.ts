import type { QuizImportOption, QuizImportPreview, QuizImportRow } from "shared";
import { Decimal } from "../repositories/decimal.js";
import { readSpreadsheetRows } from "./spreadsheetReader.js";
import { createQuizForTeacher, createQuestion } from "../repositories/quiz.repository.js";
import { createImportBatch } from "../repositories/importBatch.repository.js";

const OPTION_LETTERS = ["A", "B", "C", "D"];

// Expected columns: Question, Points, OptionA, OptionB, OptionC, OptionD, Correct
function parseRow(rowNumber: number, cells: string[]): QuizImportRow {
  const [questionText = "", pointsRaw = "", optA = "", optB = "", optC = "", optD = "", correctRaw = ""] = cells;
  const rawOptions = [optA, optB, optC, optD];
  const points = Number(pointsRaw);
  const correctIndex = OPTION_LETTERS.indexOf(correctRaw.trim().toUpperCase());

  const errors: string[] = [];
  if (!questionText.trim()) errors.push("Missing question text");
  if (!Number.isFinite(points) || points <= 0) errors.push("Points must be a positive number");
  if (rawOptions.some((o) => !o.trim())) errors.push("All four options are required");
  if (correctIndex === -1) errors.push("Correct must be A, B, C, or D");

  if (errors.length > 0) {
    return { rowNumber, questionText: questionText.trim(), points: 0, options: [], status: "ERROR", error: errors.join("; ") };
  }

  const options: QuizImportOption[] = rawOptions.map((text, i) => ({ text: text.trim(), isCorrect: i === correctIndex }));
  return { rowNumber, questionText: questionText.trim(), points, options, status: "OK" };
}

export async function previewQuizImport(fileBuffer: Buffer, filename: string): Promise<QuizImportPreview> {
  const rawRows = await readSpreadsheetRows(fileBuffer, filename);
  const rows = rawRows.slice(1).map((cells, i) => parseRow(i + 1, cells));
  const willImport = rows.filter((r) => r.status === "OK").length;
  return { rows, summary: { total: rows.length, willImport } };
}

export interface QuizImportSettings {
  classIds: string[];
  opensAt: Date;
  closesAt: Date;
  timeLimitMinutes: number;
  negMarkEnabled: boolean;
  negMarkPenalty?: number;
}

// Preview is never persisted (research.md) — confirm re-parses the
// re-uploaded file and creates the quiz + only the OK rows as questions.
export async function confirmQuizImport(fileBuffer: Buffer, filename: string, ownerTeacherId: string, settings: QuizImportSettings) {
  const preview = await previewQuizImport(fileBuffer, filename);
  const okRows = preview.rows.filter((r) => r.status === "OK");

  const quiz = await createQuizForTeacher(ownerTeacherId, {
    title: filename.replace(/\.(xlsx|csv)$/i, ""),
    classIds: settings.classIds,
    opensAt: settings.opensAt,
    closesAt: settings.closesAt,
    timeLimitMinutes: settings.timeLimitMinutes,
    negMarkEnabled: settings.negMarkEnabled,
    negMarkPenalty: new Decimal(settings.negMarkPenalty ?? 0),
  });

  // Sequential: createQuestion derives orderIndex from the current question
  // count, so parallel inserts would race on that count.
  for (const row of okRows) {
    await createQuestion(quiz.id, { text: row.questionText, points: new Decimal(row.points), options: row.options });
  }

  await createImportBatch({
    type: "QUIZ",
    uploadedByUserId: ownerTeacherId,
    fileName: filename,
    rowsTotal: preview.summary.total,
    rowsCreated: okRows.length,
    rowsSkippedDuplicate: 0,
    rowsFailed: preview.summary.total - okRows.length,
  });

  return { quizId: quiz.id };
}
