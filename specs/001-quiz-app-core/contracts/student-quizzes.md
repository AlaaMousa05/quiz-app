# Contract: Student Quiz-Taking

Schemas in `shared/src/schemas/attempt.schema.ts`. All times returned as ISO-8601 UTC; the client formats to Asia/Amman (FR-025).

## `GET /api/quizzes`

**FRs**: FR-006. **Auth**: STUDENT. **Screens**: S2.

Response `200`: `{ open: QuizSummary[]; upcoming: QuizSummary[]; done: QuizSummary[] }` where `QuizSummary = { id, title, classNames, timeLimitMinutes, opensAt, closesAt, hasAttempt: boolean, attemptStatus?: "IN_PROGRESS"|"SUBMITTED"|"AUTO_FINALIZED" }`. Server pre-filters to quizzes assigned to the student's own class and excludes drafts (FR-006) — there is no "all quizzes" mode for this endpoint.

## `GET /api/quizzes/:quizId`

**FRs**: FR-004, FR-032. **Auth**: STUDENT (own class only). **Screens**: S3.

Response `200`: `{ id, title, timeLimitMinutes, totalPoints, questionCount, negMarkEnabled, negMarkPenalty, opensAt, closesAt, hasAttempt, attemptId? }`.

Errors: `404 NotFoundError` if the quiz doesn't exist, is a draft, or isn't assigned to the student's class (all three return an identical 404 — FR-006's "must not appear... cannot be started directly" extends to not leaking existence).

## `POST /api/quizzes/:quizId/attempts`

**FRs**: FR-007, FR-008. **Auth**: STUDENT. **Screens**: S3 → S4.

No body. Creates the `Attempt` row with `startedAt = clock.now()` and computed `deadlineAt`.

Response `201`: `{ attemptId }`.

Errors: `409 ConflictError` if an attempt already exists (DB unique constraint, FR-007 — includes the double-tab/double-submit race case); `403 ForbiddenError` if outside `[opensAt, closesAt]` (FR-006) — the "even within the grace window" rule (FR-008) applies here: this endpoint never honors the grace period, only save/submit do.

## `GET /api/attempts/:attemptId`

**FRs**: FR-008a. **Auth**: STUDENT (own attempt only). **Screens**: S4 (resume).

Response `200`: `{ quizId, deadlineAt, remainingSeconds, questions: [{ id, text, points, options: [{id, text}] }], answers: { [questionId]: optionId | null } }` — never includes `isCorrect` on any option (FR-010).

## `PATCH /api/attempts/:attemptId/answers`

**FRs**: FR-008a. **Auth**: STUDENT (own attempt). **Screens**: S4.

Request (`answerSaveSchema`): `{ questionId: string; optionId: string | null }` — fired on every selection (autosave).

Response `200`: `{ savedAt }`. Upserts the `Answer` row (composite PK `attemptId, questionId`).

Errors: `409 DeadlinePassedError` if `clock.now()` is more than 10s past `deadlineAt` (FR-008's grace period) — client shows the offline/retry banner (ui.md S4); `410 Gone` (mapped from a domain `AttemptAlreadyFinalizedError`) if the attempt is already `SUBMITTED`/`AUTO_FINALIZED`.

## `POST /api/attempts/:attemptId/submit`

**FRs**: FR-009, FR-011, FR-012, FR-012b, FR-013. **Auth**: STUDENT (own attempt). **Screens**: S5 → S6.

No body. Server computes the score from stored `Answer` rows and the answer key — never from anything client-submitted (FR-011). Sets `status = SUBMITTED`, `submittedAt = clock.now()`.

Response `200`: `{ score, maxPoints }`.

Errors: same `409`/`410` as the answers endpoint, honoring the same 10-second grace period (FR-008).

_(The deadline sweep that transitions abandoned attempts to `AUTO_FINALIZED` — FR-009 — runs as a background job/lazy check on read, not a client-facing endpoint; see plan.md Phase 4.)_

## `GET /api/attempts/:attemptId/result`

**FRs**: FR-010, FR-013. **Auth**: STUDENT (own attempt). **Screens**: S6.

Response `200`: `{ score, maxPoints, submittedAt, quizClosesAt }`. No per-question breakdown (FR-010).

## `GET /api/attempts/:attemptId/review`

**FRs**: FR-010 (post-close reveal). **Auth**: STUDENT (own attempt). **Screens**: S7.

Response `200`: `{ score, maxPoints, questions: [{ id, text, points, options: [{ id, text }], selectedOptionId, correctOptionId, pointsAwarded }] }` — `options` is in display order (A/B/C/D), so the client can render "Your answer: B. 3" rather than a bare id.

Errors: `403 ForbiddenError` if `clock.now() < quiz.closesAt` — enforced server-side regardless of what the client's clock or URL guessing attempts (FR-010, constitution Principle I).
