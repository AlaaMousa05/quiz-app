import { z } from "zod";

// Quiz-spreadsheet import only (FR-018/019/019a) — the student/teacher
// import variants (FR-016/017/020) land in Phase 8.

export interface QuizImportOption {
  text: string;
  isCorrect: boolean;
}

export interface QuizImportRow {
  rowNumber: number;
  questionText: string;
  points: number;
  options: QuizImportOption[];
  status: "OK" | "ERROR";
  error?: string;
}

export interface QuizImportPreview {
  rows: QuizImportRow[];
  summary: { total: number; willImport: number };
}

// The `confirm` step re-parses the same re-uploaded file (preview is never
// persisted — research.md) alongside the quiz settings chosen in the import
// flow itself (FR-018: the spreadsheet only carries question content).
// Sent as multipart form fields, so every value arrives as a string;
// `classIds` is a JSON-encoded array string, and boolean/number fields are
// coerced explicitly rather than via `z.coerce.boolean()` (which would treat
// the literal string "false" as truthy).
export const quizImportConfirmFieldsSchema = z
  .object({
    classIds: z
      .string()
      .transform((value) => JSON.parse(value) as unknown)
      .pipe(z.array(z.string().min(1)).min(1)),
    opensAt: z.coerce.date(),
    closesAt: z.coerce.date(),
    timeLimitMinutes: z.coerce.number().int().positive().default(20),
    negMarkEnabled: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
    negMarkPenalty: z.coerce.number().min(0).max(1).optional(),
  })
  .refine((data) => data.closesAt > data.opensAt, { message: "Closes must be after Opens", path: ["closesAt"] })
  .refine((data) => !data.negMarkEnabled || data.negMarkPenalty !== undefined, {
    message: "negMarkPenalty is required when negMarkEnabled",
    path: ["negMarkPenalty"],
  });

export type QuizImportConfirmFields = z.infer<typeof quizImportConfirmFieldsSchema>;
