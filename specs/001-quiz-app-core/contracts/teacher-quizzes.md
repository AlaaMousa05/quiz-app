# Contract: Teacher Quiz Authoring & Results

Schemas in `shared/src/schemas/quiz.schema.ts`. All endpoints require **Auth**: TEACHER, and every quiz-scoped endpoint additionally checks `quiz.ownerTeacherId === session.userId` (constitution Principle III) — a teacher requesting another teacher's quiz gets `403 ForbiddenError`, indistinguishable from a malformed ID (no existence leak).

## `GET /api/teacher/quizzes`

**FRs**: FR-014. **Screens**: T1.

Response `200`: `QuizListItem[]` where `QuizListItem = { id, title, status, classNames, attemptCount, enrolledCount }`, scoped to `ownerTeacherId = session.userId`.

## `POST /api/teacher/quizzes`

**FRs**: FR-004, FR-012a. **Screens**: T2.

Request (`quizSettingsSchema`): `{ title, classIds, opensAt, closesAt, timeLimitMinutes, negMarkEnabled, negMarkPenalty }`. `negMarkEnabled`/`negMarkPenalty` default from `session.user`'s profile default (FR-012a) if omitted.

Response `201`: `{ quizId }`, `status: DRAFT`.

## `PATCH /api/teacher/quizzes/:quizId`

**FRs**: FR-004, FR-024. **Screens**: T2.

Request: partial `quizSettingsSchema`.

Errors: `409 ConflictError` (mapped from a domain `QuizLockedError`) if the quiz is locked (≥1 attempt exists) and the request touches any field other than `opensAt`/`closesAt` (FR-024) — response body names which field(s) were rejected so the UI can show the "only dates can still change" banner (ui.md T2).

## `GET/POST/PATCH/DELETE /api/teacher/quizzes/:quizId/questions[/:questionId]`

**FRs**: FR-005, FR-023, FR-024. **Screens**: T3.

`POST`/`PATCH` body (`questionSchema`): `{ text, points, options: [{ text, isCorrect }] × 4 }` — exactly 4 options, exactly 1 `isCorrect: true`, or `422 ValidationError`.

`DELETE` and any question mutation: same `409 QuizLockedError` as above once the quiz has an attempt.

## `POST /api/teacher/quizzes/:quizId/publish`

**FRs**: FR-004, FR-023. **Screens**: T3.

No body. Sets `status = PUBLISHED`. One-directional (research.md) — no unpublish endpoint.

Errors: `422 ValidationError` if the quiz has zero questions (FR-023).

## `GET /api/teacher/quizzes/:quizId/results`

**FRs**: FR-014, FR-026. **Screens**: T5.

Response `200`: `{ classAverage, maxPoints, perQuestionPctCorrect: [{ questionId, pctCorrect }], students: [{ studentId, name, status: "NOT_STARTED"|"IN_PROGRESS"|"SUBMITTED"|"AUTO_FINALIZED", score? }] }`.

## `GET /api/teacher/quizzes/:quizId/results/export.csv`

**FRs**: FR-027. **Screens**: T5. Response: `text/csv` attachment, same rows as the results endpoint above (student name, status, score) plus a summary header row (class average).
