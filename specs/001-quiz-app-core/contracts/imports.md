# Contract: Spreadsheet Imports

Schemas in `shared/src/schemas/import.schema.ts`. Every `*/preview` endpoint is side-effect-free (parses and validates only); every `*/confirm` endpoint requires a prior successful `preview` response and persists.

## `POST /api/imports/students/preview` and `.../confirm`

**FRs**: FR-016, FR-019, FR-019a, FR-020, FR-020a. **Auth**: ADMIN. **Screens**: A5.

Request: `multipart/form-data`, one file field (`.xlsx` or `.csv`).

`preview` response `200`: `{ rows: [{ rowNumber, name, className, studentId?: string, status: "OK"|"OK_NEW_CLASS"|"DUPLICATE_SKIPPED"|"ERROR", error?: string }], summary: { total, willImport, newClasses: string[] } }`.

`confirm` response `201`: `{ importBatchId, created: [{ userId, username, name, temporaryPassword }] }` — this response **is** the printable-credentials view (FR-031b); the password is returned exactly once and never retrievable again (only a reset, via `admin-users.md`, produces a new one).

Errors: `422` with message `"Save as CSV UTF-8 or upload XLSX"` (FR-019a) if the file fails strict UTF-8 decode and isn't valid XLSX — returned by `preview` before any row is parsed.

## `POST /api/imports/teachers/preview` and `.../confirm`

**FRs**: FR-017, FR-019, FR-019a, FR-020. Same shape as students, without the class/student-ID fields.

## `POST /api/imports/quiz/preview` and `.../confirm`

**FRs**: FR-018, FR-019, FR-019a. **Auth**: TEACHER (owner = self) or ADMIN (must supply `ownerTeacherId` in the request). **Screens**: T4.

`confirm` request additionally carries the settings chosen in the import flow itself (`quizSettingsSchema` fields — classIds/dates/timeLimit/negMarking), since the spreadsheet contains only question content (FR-018).

`confirm` response `201`: `{ quizId }`, `status: DRAFT` — lands the caller in the Questions Editor (T3) to review before publishing, same as a hand-built quiz.
