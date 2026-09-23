# Phase 1 Data Model: Quiz App Core

Derived from `spec.md`'s Key Entities and the schema named in the plan input. All monetary/points values use Prisma's `Decimal` type (constitution Principle I) — never a JS `number`/float. All timestamps are stored as UTC `timestamptz` and converted to Asia/Amman only at the presentation layer (Delivery Constraints, FR-025).

## Entities

### User

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `role` | `enum Role { ADMIN TEACHER STUDENT }` | FR-001 |
| `name` | `String` | Display name; may contain Arabic (FR-022) |
| `nameNormalized` | `String` | Computed via `normalizeArabicName(name)` at write time (research.md); indexed for FR-038 search |
| `username` | `String @unique` | Student: `S<class><NN>` (FR-001); Teacher/Admin: short generated handle |
| `passwordHash` | `String` | bcrypt, cost 12 |
| `status` | `enum UserStatus { ACTIVE DEACTIVATED }` | FR-031a |
| `classId` | `String? @relation` | Required (non-null) when `role = STUDENT`; null otherwise (FR-003) — enforced in the service layer, since Prisma/Postgres can't express "required iff role=X" declaratively |
| `negMarkDefaultEnabled` | `Boolean?` | Teacher-only profile default (FR-012a); null for non-teachers |
| `negMarkDefaultPenalty` | `Decimal(3,2)?` | Teacher-only profile default, 0.00–1.00; null for non-teachers |
| `createdAt` / `updatedAt` | `DateTime` | |

Validation: `username` unique across all roles (one login namespace). `negMarkDefaultPenalty` when present MUST be within `[0, 1]` (Zod schema in `shared/`).

### Class

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `name` | `String @unique` | e.g., `10A`; seeded with `10A`, `10B`, `11A` (FR-031d) |
| `status` | `enum ClassStatus { ACTIVE ARCHIVED }` | FR-028/FR-029 |
| `createdAt` / `updatedAt` | `DateTime` | |

Deletion rule (FR-028): a `Class` may be hard-deleted only if `students.count === 0 AND quizzes.count === 0` (checked in the service before calling the repository's delete — not a DB constraint, since "count of related rows is zero" isn't expressible as a Postgres constraint without a trigger, and a service-level check is simpler per Principle IX).

### Quiz

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `title` | `String` | |
| `ownerTeacherId` | `String @relation(User)` | FR-004; the importing teacher, or the teacher chosen by the admin on import (FR-018) |
| `status` | `enum QuizStatus { DRAFT PUBLISHED }` | FR-004; DRAFT↔PUBLISHED, but unpublish (PUBLISHED→DRAFT) allowed only while no attempts exist (research.md) |
| `opensAt` / `closesAt` | `DateTime` (UTC) | FR-004, FR-006 |
| `timeLimitMinutes` | `Int @default(20)` | FR-004 |
| `negMarkEnabled` | `Boolean` | FR-012, defaults from owner's profile at creation (FR-012a) |
| `negMarkPenalty` | `Decimal(3,2)` | 0.00–1.00, FR-012 |
| `createdAt` / `updatedAt` | `DateTime` | |

Derived (not stored): **locked** = `EXISTS(Attempt WHERE quizId = this.id)` (research.md) — when true, every field above except `opensAt`/`closesAt` is read-only (FR-024). **visible-to-class** = `status = PUBLISHED AND class in QuizClass`. Must have ≥1 `Question` to be publishable (FR-023).

### QuizClass (join table)

| Field | Type | Notes |
|---|---|---|
| `quizId` | `String @relation(Quiz)` | |
| `classId` | `String @relation(Class)` | |
| — | `@@id([quizId, classId])` | Composite PK; a quiz has one-or-more rows here (FR-004) |

### Question

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `quizId` | `String @relation(Quiz)` | |
| `text` | `String` | May contain Arabic (FR-022); `dir="auto"` applied at render, not stored |
| `points` | `Decimal(6,2)` | FR-005 |
| `orderIndex` | `Int` | Display/attempt order |
| `createdAt` / `updatedAt` | `DateTime` | |

Validation: a `Question` MUST have exactly 4 `Option` rows with exactly 1 marked `isCorrect` (FR-005) — enforced in the service on create/update, since "exactly N related rows, exactly one flagged" isn't a native Postgres constraint at reasonable complexity for this scale.

### Option

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `questionId` | `String @relation(Question)` | |
| `text` | `String` | |
| `isCorrect` | `Boolean` | |
| `orderIndex` | `Int` | A/B/C/D display order |

### Attempt

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `quizId` | `String @relation(Quiz)` | |
| `studentId` | `String @relation(User)` | |
| `startedAt` | `DateTime` (UTC, server clock) | FR-008 |
| `deadlineAt` | `DateTime` (UTC) | Computed once at start: `min(startedAt + quiz.timeLimitMinutes, quiz.closesAt)` (FR-008); stored (not recomputed) so a later edit to `closesAt` — the one field still editable post-lock — never retroactively changes an already-running attempt's deadline |
| `submittedAt` | `DateTime?` (UTC) | Null while in progress |
| `status` | `enum AttemptStatus { IN_PROGRESS SUBMITTED AUTO_FINALIZED }` | FR-009 |
| `score` | `Decimal(6,2)?` | Null until submitted/auto-finalized; floored at 0 (FR-012b) |
| `createdAt` / `updatedAt` | `DateTime` | |

Constraint: **`@@unique([quizId, studentId])`** — the database-level guarantee behind FR-007 and constitution Principle II; enforced by Postgres, not just application logic, so a race between two near-simultaneous "start attempt" requests (e.g., two browser tabs) fails one of them at the DB layer with a constraint violation, which the service maps to a `ConflictError` (409) rather than silently creating a duplicate.

### Answer

| Field | Type | Notes |
|---|---|---|
| `attemptId` | `String @relation(Attempt)` | |
| `questionId` | `String @relation(Question)` | |
| `optionId` | `String? @relation(Option)` | Null = left unanswered |
| `answeredAt` | `DateTime` (UTC) | Updated on every autosave (FR-008a) |
| — | `@@id([attemptId, questionId])` | Composite PK, per plan input — one row per question per attempt, upserted on each autosave |

### ImportBatch (audit record, not row-level staging — see research.md)

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `type` | `enum ImportType { STUDENTS TEACHERS QUIZ }` | |
| `uploadedByUserId` | `String @relation(User)` | |
| `fileName` | `String` | |
| `rowsTotal` / `rowsCreated` / `rowsSkippedDuplicate` / `rowsFailed` | `Int` | Summary counts only (FR-019) |
| `createdAt` | `DateTime` | |

### Session (infrastructure-managed, not a domain entity)

`connect-pg-simple` creates and manages its own `session` table in the same Postgres database (one DB, per the Simplicity principle) — it is not part of the Prisma schema and carries no domain fields; listed here only so the full set of tables in the database is documented somewhere.

## Relationships

```
Class 1──* User (students)
User (teacher) 1──* Quiz (ownerTeacherId)
Quiz *──* Class (via QuizClass)
Quiz 1──* Question 1──* Option
Quiz 1──* Attempt *──1 User (student)      [unique on (quizId, studentId)]
Attempt 1──* Answer *──1 Question
Answer *──1 Option (nullable)
User (uploader) 1──* ImportBatch
```

## State transitions

**Quiz**: `DRAFT → PUBLISHED` (publish) and `PUBLISHED → DRAFT` (unpublish); unpublish is permitted only while the quiz is not `locked` (zero attempts), so once the first attempt exists the quiz can no longer leave `PUBLISHED` (research.md). Field mutability: all fields editable while `DRAFT`; once `locked` (≥1 attempt exists), only `opensAt`/`closesAt` remain editable regardless of `DRAFT`/`PUBLISHED` (FR-024) — the rule is expressed in terms of attempt existence, not status, so the same lock condition governs both "which fields are editable" and "can this be unpublished."

**Attempt**: `IN_PROGRESS → SUBMITTED` (explicit student submit, FR-013) or `IN_PROGRESS → AUTO_FINALIZED` (deadline + grace period elapsed, FR-009). Both are terminal — no further transitions, no re-opening.

**Class**: `ACTIVE → ARCHIVED` and `ARCHIVED → ACTIVE` (restore); archiving does not cascade to students/quizzes (FR-029), and restoring simply makes the class assignable again with its roster and history intact.

**User**: `ACTIVE → DEACTIVATED` and back (FR-031a implies a reversible action, since the Admin Users screen — ui.md A4 — shows a "Reactivate" action on a deactivated row).

## Validation summary (Zod, defined once in `shared/src/schemas/`)

| Schema | Backs | Key rules |
|---|---|---|
| `loginSchema` | `POST /api/auth/login` | `username` non-empty, `password` non-empty |
| `quizSettingsSchema` | Quiz create/update | `title` non-empty; `closesAt > opensAt`; `timeLimitMinutes` positive int; `classIds` non-empty array; `negMarkPenalty` in `[0,1]` when `negMarkEnabled` |
| `questionSchema` | Question create/update | exactly 4 `options`, exactly 1 `isCorrect: true`, `points > 0` |
| `answerSaveSchema` | `PATCH /attempts/:id/answers` | `questionId` belongs to the attempt's quiz; `optionId` (if present) belongs to that question |
| `classSchema` | Class create/rename | `name` non-empty, unique (checked in service) |
| `userCreateSchema` | Admin single-user create | `role` in enum; `classId` required iff `role = STUDENT` |
| `importPreviewSchema` / `importConfirmSchema` | Import endpoints | file MUST decode as UTF-8 (BOM optional) or be XLSX (FR-019a); row shape depends on `type` |
