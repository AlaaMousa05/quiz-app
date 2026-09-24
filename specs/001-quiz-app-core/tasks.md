---
description: "Task list for Quiz App Core (Clickable MVP)"
---

# Tasks: Quiz App Core (Clickable MVP)

**Input**: Design documents from `specs/001-quiz-app-core/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, ui.md, traceability.md

**Organization**: Tasks are grouped by the **11 implementation phases defined in plan.md** (per the project owner's explicit sequencing), not by user story. Phases that touch scoring, timing, attempts, auth/permissions, or imports place their test tasks **before** the implementation tasks (constitution Principle VI). Every implementation phase ends with a **Quality gate** task (CLAUDE.md's "Quality gate (end of every implementation phase)") followed by a **commit** task.

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task in the same phase)
- Test task descriptions reference the planned test names from `traceability.md` where applicable
- File paths follow the folder structure in plan.md (`client/`, `server/`, `shared/`)

## Conventions used below

- **Quality gate** task = run the 6-step gate from CLAUDE.md in order: (1) lint + all tests pass; (2) `/simplify` on the phase's changes, apply fixes; (3) for phases touching scoring/timing/attempts/auth/imports, `/code-review` at medium effort, fix confirmed findings; (4) re-check Code-structure rules (file/function size, no Prisma outside `repositories/`, no fetch outside feature `api/`, no logic in presentational components), split what breaks them; (5) re-run lint + tests; (6) log `/simplify` + `/code-review` findings and changes in `notes/ai-log.md`.
- **Commit** task = make the phase's final Conventional-Commit after the quality gate passes.
- Phases touching the gate's `/code-review` trigger areas: **2** (auth), **3** (scoring), **4** (timing/attempts), **6** (imports), **8** (imports) — these run `/code-review` medium in step 3. Phases 1, 5, 7, 9, 10, 11 run the gate without the `/code-review` step except phase 11's project-end reviews.

---

## Phase 1: Scaffold + Docker + schema

**Goal**: A running two-container skeleton (`db`, `app`) with the monorepo layout, Prisma schema/migration, and lint tooling — nothing feature-specific yet.

- [X] T001 Create npm-workspaces root `package.json` with `"workspaces": ["client","server","shared"]` and root scripts (`lint`, `test`, `dev`, `build`) fanning out to workspaces
- [X] T002 [P] Scaffold `shared/` workspace: `package.json`, `tsconfig.json`, empty `src/schemas/`, `src/i18n/`, `src/arabicName.ts` placeholder
- [X] T003 [P] Scaffold `server/` workspace: `package.json`, `tsconfig.json` (strict mode), `src/app.ts` + `src/server.ts` Express skeleton
- [X] T004 [P] Scaffold `client/` workspace: Vite + React + TS, `tailwind.config.ts` restricted to logical properties (no left/right utilities), `@fontsource/noto-sans` + `@fontsource/noto-sans-arabic` self-hosted
- [X] T005 [P] Add ESLint + Prettier config to `server/.eslintrc.cjs` and `client/.eslintrc.cjs`: `max-lines: [warn,200]`, `max-lines-per-function: [warn,40]`, `@typescript-eslint/no-explicit-any: error`, `@typescript-eslint/no-non-null-assertion: warn` (per research.md)
- [X] T006 Author `server/prisma/schema.prisma` with all entities from data-model.md (User, Class, Quiz, QuizClass, Question, Option, Attempt, Answer, ImportBatch), including `@@unique([quizId, studentId])` on Attempt, composite PK on Answer/QuizClass, all `Decimal` score/points/penalty columns, and the `nameNormalized` column with an index
- [X] T007 Generate the initial Prisma migration and wire `prisma migrate deploy` + conditional seed (only if `User` count is 0, per research.md) into the `app` container start
- [X] T008 [P] Write `Dockerfile` (build client → build server → single `app` image serving both) and `docker-compose.yml` with `db` and `app` services; add `.env.example`
- [X] T009 [P] Add `server/src/config/env.ts` validating environment variables with Zod at startup
- [X] T010 Verify `docker compose up --build` brings up both services and the app serves a placeholder page (quickstart.md step 1)
- [X] T011 Quality gate for Phase 1 (lint + tests, `/simplify`, structure re-check, re-run lint + tests, log to `notes/ai-log.md`; no `/code-review` step — no scoring/timing/attempt/auth/import code yet)
- [X] T012 Commit Phase 1: `chore: scaffold monorepo, docker compose, prisma schema`

---

## Phase 2: Auth + roles + i18n shell

**Goal**: Session-based login/logout for all three roles, role/ownership middleware, and the bilingual shell (dictionaries, provider, toggle, `<html dir/lang>`). **Touches auth → tests before implementation.**

### Tests first

- [X] T013 [P] Write `shared` i18n key-parity test `shared/src/i18n/i18n.spec.ts` — fails if a key exists in `en.ts` but not `ar.ts` or vice versa (research.md)
- [X] T014 [P] Write auth integration tests `server/tests/integration/auth.routes.test.ts` referencing traceability names `auth.spec: student can log in with username + password` and `auth.spec: invalid credentials are rejected`, plus deactivated-user-denied (FR-031a) — Supertest against the real test Postgres
- [X] T015 [P] Write role/ownership middleware unit/integration coverage: a STUDENT is refused a TEACHER route, a TEACHER is refused another teacher's quiz (403), per constitution Principle III

### Implementation

- [X] T016 [P] Create `shared/src/i18n/en.ts` and `ar.ts` typed so `ar` is `Record<keyof typeof en, string>`; seed with the shell/nav/login keys
- [X] T017 [P] Create `shared/src/schemas/auth.schema.ts` (`loginSchema`) per contracts/auth.md
- [X] T018 Implement `server/src/middleware/session.middleware.ts` (express-session + connect-pg-simple against the same Postgres)
- [X] T019 Implement `server/src/services/auth.service.ts` (bcrypt verify, cost 12; no req/res; deactivated-user check)
- [X] T020 Implement `server/src/repositories/user.repository.ts` (find-by-username, used by auth)
- [X] T021 Implement `server/src/errors/` typed domain errors (DomainError, NotFound, Forbidden, Conflict, ValidationError, DeadlinePassed) + `index.ts`
- [X] T022 Implement `server/src/middleware/errorHandler.middleware.ts` mapping domain errors → HTTP codes + i18n message keys
- [X] T023 [P] Implement `server/src/middleware/requireAuth.middleware.ts`, `requireRole.middleware.ts`, `requireOwnership.middleware.ts`
- [X] T024 Implement `server/src/controllers/auth.controller.ts` + `routes/auth.routes.ts` for `POST /login`, `POST /logout`, `GET /me` (contracts/auth.md)
- [X] T025 [P] Implement `client/src/lib/i18n/I18nProvider.tsx` + `useTranslation.ts`; default language from browser, persisted per device; switches `<html dir/lang>` (FR-034/FR-035)
- [X] T026 [P] Implement `client/src/components/ui/LanguageToggle.tsx`
- [X] T027 Implement `client/src/features/auth/` (api/, hooks/, components/, pages/) Login screen S1 + `client/src/routes/router.tsx` and `RoleGuard.tsx` shell (guarded empty role landing pages)
- [X] T028 Run auth + i18n tests; confirm all green
- [X] T029 Quality gate for Phase 2 (includes `/code-review` medium on the auth changes, step 3)
- [X] T030 Commit Phase 2: `feat: session auth, role guards, bilingual shell`

---

## Phase 3: Scoring (TDD)

**Goal**: Pure, unit-tested scoring service. **Touches scoring → tests strictly first (Principle VI).**

### Tests first

- [X] T031 [P] Write `server/tests/unit/scoring.service.test.ts` referencing traceability names: `scoring.spec: negative-marking penalty applies configured fraction of question points`, `scoring.spec: total score floors at zero`, `scoring.spec: score shown immediately after submit` (score computation part), plus correct/incorrect/unanswered cases and no-negative-marking case (FR-012, FR-012b)

### Implementation

- ~~T032~~ Merged into T063 (Phase 6) — `quiz.schema.ts` + `question.schema.ts` weren't needed by T031's pure-function test surface, and `quiz.service.ts` (T063) is their first real caller, so they're created there instead of as a standalone task.
- [X] T033 Implement `server/src/services/scoring.service.ts` as pure functions (Decimal math, penalty = fraction × question points, unanswered = 0, total floored at 0) until T031 is green
- [X] T034 Run scoring tests; confirm green
- [X] T035 Quality gate for Phase 3 (includes `/code-review` medium on scoring, step 3)
- [X] T036 Commit Phase 3: `feat: scoring service with negative marking (TDD)`

---

## Phase 4: Attempt lifecycle API (TDD)

**Goal**: Start/resume/autosave/submit/auto-finalize with server-authoritative timing and the DB-enforced single attempt. **Touches timing + attempts → tests strictly first.**

### Tests first

- [X] T037 [P] Write `server/tests/unit/attempt.service.test.ts` with an injected `FixedClock`/`AdvanceableClock`: deadline = `min(startedAt + limit, closesAt)`, 10s grace accept/reject, auto-finalize at deadline, referencing traceability names `attempt.spec: countdown enforces server-recorded deadline`, `attempt.spec: auto-finalizes at deadline with recorded answers`, `attempt.spec: submission within 10s grace after deadline is accepted`, `attempt.spec: starting a new attempt after closes_at is blocked even within the grace window` — tests pure functions (`computeDeadlineAt`, `isWithinGracePeriod`, `canStartAttempt`, `resolveAttemptOnRead`) that `server/src/services/attempt.service.ts` (T042) must export; currently red (module doesn't exist yet)
- [X] T038 [P] Write `server/tests/integration/student-quizzes.routes.test.ts`, `student-quizzes.deadline.test.ts`, `student-quizzes.access.test.ts`, `student-quizzes.finalize.test.ts` (Supertest, real Postgres — split across 4 files to stay under the ~200-line guideline) referencing `attempt.spec: second attempt blocked after submission`, `attempt.spec: duplicate attempt blocked under concurrent/double-submit/two-tab requests`, `attempt.spec: answers autosave and resume with correct remaining time`, `scoring.spec: correctness never revealed before submission`, `access.spec: quiz not startable outside its open date range`, plus cross-class/cross-student ownership, tampered-optionId rejection, and lazy finalization on read; currently red (routes/controllers/services from T039–T043 don't exist yet)

### Implementation

- [X] T039 Implement `server/src/services/clock.ts` (Clock interface + SystemClock)
- [X] T040 [P] Create `shared/src/schemas/attempt.schema.ts` (`answerSaveSchema`) per contracts/student-quizzes.md
- [X] T041 Implement `server/src/repositories/attempt.repository.ts` (create with unique-constraint handling, upsert answer, load resume state) and `quiz.repository.ts` (read for student, derived-locked existence check)
- [X] T042 Implement `server/src/services/attempt.service.ts` (start/duplicate-block→ConflictError, autosave, submit calling scoring.service, deadline+grace, auto-finalize sweep) until T037/T038 green — split across `attempt.service.ts` (state machine), `attemptFinalize.service.ts` (lazy finalize/result/review), and `studentQuiz.service.ts` (list/intro) to stay under the file-size guideline
- [X] T043 Implement `server/src/controllers/student-quizzes.controller.ts` + `routes/student-quizzes.routes.ts` for the contracts/student-quizzes.md endpoints (list, intro, start, resume-get, autosave, submit, result, review) with role+ownership guards and the review-after-close 403 (FR-010)
- [X] T044 Run attempt + integration tests; confirm green — 72 tests passing (70 from the original two-round test table + 2 regression tests added during `/code-review`)
- [X] T045 Quality gate for Phase 4 (includes `/code-review` medium on timing/attempts, step 3) — see notes/ai-log.md for `/simplify` and `/code-review` findings and fixes
- [X] T046 Commit Phase 4: `feat: attempt lifecycle API with server-authoritative timing (TDD)`

---

## Phase 5: Student UI

**Goal**: Screens S1–S7 wired to the real API from phases 2–4. (No scoring/timing/attempt/auth/import *logic* added here — that lives server-side; hooks with real logic get tests per CLAUDE.md.)

### Tests first (hooks with real logic)

- [X] T047 [P] Write `client/tests/hooks/useQuizTimer.test.ts` (counts down from server `remainingSeconds`, stops at 0, never extends — ui.md §1.11)
- [X] T048 [P] Write `client/tests/hooks/useAutosave.test.ts` (fires on selection, shows saving/saved/offline states, retries)

### Implementation

- [X] T049 [P] Build `client/src/components/ui/` primitives: Button (+LinkButton), Card, Field, Dialog, Table (collapses to cards <640px), Badge, TimerDisplay (normal/warning/danger, ui.md §1.11)
- [X] T050 [P] Implement `client/src/lib/datetime.ts` (Asia/Amman formatting per active language, Western digits) and extend `client/src/lib/apiClient.ts` with `patch`
- [X] T051 [P] Implement `client/src/features/student-quiz/hooks/useQuizTimer.ts` and `useAutosave.ts` until T047/T048 green
- [X] T052 [P] Implement `client/src/features/student-quiz/api/` (TanStack Query hooks for the student endpoints — the only place calling the server)
- [X] T053 Build S2 My Quizzes (Open/Upcoming/Done tabs) and S3 Quiz Intro (negative-marking plain-language copy, FR-032)
- [X] T054 Build S4 Taking Quiz (one-question view, sticky timer, question grid, autosave indicator) and S5 Submit Confirmation (unanswered count) — state machine lives in `hooks/useTakingQuiz.ts`, page is composition only
- [X] T055 Build S6 Result (score only) and S7 Review (post-close breakdown) — extended `attemptFinalize.service.ts`'s review response with per-question `options` (a Phase 4 contract gap: text was needed to render "B. 4", not just ids)
- [X] T056 Build check: `tsc -b`/`vite build`/full test suite green; end-to-end curl verification of the rebuilt docker image (list/review API shapes match what S2/S7 expect). No headless-browser click-through was available in this session — see notes/ai-log.md
- [X] T057 Quality gate for Phase 5 — ran `/code-review` medium (not skipped, despite the note below) because this phase's changes touched attempt-adjacent server code (`attemptFinalize.service.ts`); see notes/ai-log.md for findings
- [X] T058 Commit Phase 5: `feat: student quiz-taking UI (S1-S7)`

---

## Phase 6: Teacher quiz editor + import

**Goal**: T1–T4 — quiz settings, questions editor, publish/unpublish, and quiz-spreadsheet import. **Touches imports → import tests before import implementation.**

### Tests first

- [X] T059 [P] Write `server/tests/unit/import.service.test.ts` for quiz import parsing referencing `import.spec: valid rows create accounts/quiz content` (quiz variant) and `import.spec: preview shows per-row errors before saving`, plus the UTF-8/XLSX-only encoding rejection ("Save as CSV UTF-8 or upload XLSX")
- [X] T060 [P] Write `server/tests/integration/teacher-quizzes.routes.test.ts` (split into `.routes.test.ts` + `.access.test.ts` to stay under the file-size guideline) referencing `quiz-builder.spec: teacher can create a quiz with questions, options, and points`, `quiz-builder.spec: question requires exactly 4 options, 1 correct answer, and a point value`, `quiz-builder.spec: time limit defaults to 20 minutes if unset`, `access.spec: quiz hidden until published`, plus the FR-024 lock (edit refused after an attempt) and FR-004a unpublish (allowed with 0 attempts, 409 after)

### Implementation

- [X] T061 [P] Create `shared/src/schemas/import.schema.ts` (preview/confirm shapes, encoding rule) per contracts/imports.md — scoped to the quiz-import variant only (student/teacher import lands in Phase 8)
- [X] T062 Implement `server/src/services/import.service.ts` (strict UTF-8 decode + BOM strip, exceljs/csv-parse row parsing, per-row validation, in-memory preview) and `repositories/importBatch.repository.ts`
- [X] T063 Create `shared/src/schemas/quiz.schema.ts` (`quizSettingsSchema`) and `shared/src/schemas/question.schema.ts` (`questionSchema`) per contracts/teacher-quizzes.md. Then implement `server/src/services/quiz.service.ts` (create/update with FR-024 lock, publish, unpublish-if-unlocked FR-004a) and `repositories/quiz.repository.ts` write paths
- [X] T064 Implement `server/src/controllers/teacher-quizzes.controller.ts` + `imports.controller.ts` and their routes (contracts/teacher-quizzes.md, contracts/imports.md quiz flow) with owner-ownership guards. Also fixed a pre-existing routing bug found in the process: `student-quizzes.routes.ts`'s router-level `requireRole("STUDENT")` was intercepting every request under the shared `/api` mount, including these new teacher/import routes — moved the guard to per-route middleware (see notes/ai-log.md)
- [X] T065 [P] Implement `client/src/features/quiz-editor/` api/ + hooks/ (`useImportPreview.ts`) — `client/tests/hooks/useImportPreview.test.ts` written and confirmed red first
- [X] T066 Build T1 My Quizzes, T2 Create/Edit Settings (locked-field mode after attempts), T3 Questions Editor (publish/unpublish), T4 Import Quiz (preview + per-row errors)
- [X] T067 Run import + teacher tests; confirm green — 89 server tests, 15 client tests
- [X] T068 Quality gate for Phase 6 — per this session's instruction, scoped to lint + tests + a structure check only (no `/simplify`/`/code-review`; those resume as the consolidated Phase 10 pass)
- [X] T069 Commit Phase 6: `feat: teacher quiz editor and quiz import`

---

## Phase 7: Results + CSV export

**Goal**: T5 Quiz Results (per-student status/score, class average, per-question % correct, CSV) plus admin-unfiltered reuse (A6/A7).

- [X] T070 [P] Write `server/tests/integration/results.routes.test.ts` referencing `results.spec: teacher sees results for own quiz`, `results.spec: admin sees results for any quiz`, `results.spec: CSV export matches on-screen data`, plus non-owner-denied (Principle III)
- [X] T071 Implement results read in `server/src/services/quizResults.service.ts` (`getResults(quizId)` — aggregates status/score/class-average/per-question %; also lazily finalizes any expired-but-unread attempt so results are never stale) and CSV serialization — a sibling file to `quiz.service.ts` rather than added there, to stay under the file-size guideline
- [X] T072 Implement teacher results routes + `admin-scope` routes (new `admin.routes.ts`/`admin-quizzes.controller.ts`) reusing the same `quizResults.service.ts` (contracts/teacher-quizzes.md, contracts/admin-scope.md) — one service, two guards (Principle IX / FR-031c)
- [X] T073 [P] Implement `client/src/features/results/` (api/, components/, pages/) — one `QuizResultsPage` (scope prop) used by T5, A6, A7
- [X] T074 Build T5 Quiz Results with CSV export link; A6 All Quizzes and A7 All Results (grouped by class) as admin browsing indexes into the same screen
- [X] T075 Run results tests; confirm green — 93 server tests, 15 client tests
- [X] T076 Quality gate for Phase 7 — per this session's instruction, lint + tests + a structure check only (no `/code-review`, consistent with the task's own note that this phase doesn't touch scoring/timing/attempt/auth/import logic directly)
- [X] T077 Commit Phase 7: `feat: quiz results, class averages, CSV export`

---

## Phase 8: Admin classes + users + import

**Goal**: A2–A5 — class CRUD/archive/restore/move-student, user CRUD/reset/deactivate, student & teacher import. **Touches imports + auth (credential creation) → tests before implementation.**

### Tests first

- [ ] T078 [P] Write `server/tests/integration/admin-classes.routes.test.ts` referencing `admin.spec: create/rename/archive a class`, `admin.spec: class with students or quizzes cannot be deleted`, `admin.spec: move student preserves past attempts and updates future quiz visibility`, plus class restore (FR-028/029) and auto-created class on import (FR-020a)
- [ ] T079 [P] Write `server/tests/integration/admin-users.routes.test.ts` referencing `admin.spec: deactivated user cannot log in but history is retained`, plus student/teacher import (`import.spec: valid rows create accounts/quiz content`, `import.spec: preview shows per-row errors before saving`), duplicate skip (FR-020), and student-ID generation `S<class><NN>` (FR-016)
- [ ] T080 [P] Write `server/tests/unit/arabicSearch.service.test.ts` referencing `search.spec: Arabic name search ignores diacritics and normalizes alef variants` (FR-038)

### Implementation

- [ ] T081 [P] Implement `shared/src/arabicName.ts` `normalizeArabicName()` (diacritic strip, alef unify, teh-marbuta map) per research.md, until T080 green
- [ ] T082 [P] Create `shared/src/schemas/class.schema.ts` + `user.schema.ts` (userCreateSchema, classId required iff STUDENT)
- [ ] T083 Implement `server/src/services/class.service.ts` (create/rename/archive/restore, delete-only-if-empty), `user.service.ts` (single create, generated username+password, reset, deactivate/reactivate), `arabicSearch.service.ts`, and extend `import.service.ts` for students/teachers (student-ID from file or generated, auto-create missing class)
- [ ] T084 Implement `class.repository.ts` and extend `user.repository.ts`; write `nameNormalized` on every user write
- [ ] T085 Implement `server/src/controllers/admin-classes.controller.ts` + `admin-users.controller.ts` and their routes (contracts/admin-classes.md, admin-users.md, imports.md student/teacher flows), all `requireRole('ADMIN')`
- [ ] T086 [P] Implement `client/src/features/admin-classes/` and `admin-users/` (api/, hooks/, components/, pages/)
- [ ] T087 Build A1 Dashboard, A2 Classes, A3 Class Detail (move student, archive/restore), A4 Users (create/reset/deactivate + printable credentials table = the post-import table, FR-031b), A5 Import Users (preview + per-row errors)
- [ ] T088 Run admin + import + arabic-search tests; confirm green
- [ ] T089 Quality gate for Phase 8 (includes `/code-review` medium on imports + credential creation, step 3)
- [ ] T090 Commit Phase 8: `feat: admin classes, users, and student/teacher import`

---

## Phase 9: Seed + sample-data spreadsheets

**Goal**: Realistic fixtures matching spec.md's Assumptions, auto-loaded on empty-DB start.

- [ ] T091 [P] Create `server/prisma/sample-data/students.xlsx` (3 classes 10A/10B/11A, ~20 each, many Arabic names), `teachers.csv` (4 teachers), `quiz-week4.xlsx` (15 questions incl. an Arabic quiz)
- [ ] T092 Implement `server/prisma/seed.ts` reading the sample data, runnable via `npm run seed` and auto-run on empty DB; referencing `seed.spec: seed data contains 10A/10B/11A with ~20 students each`, `seed.spec: seed data contains 4 teacher accounts`, `seed.spec: seed quiz has 15 questions`, `seed.spec: seed script produces realistic sample data matching the brief`
- [ ] T093 [P] Write `server/tests/integration/seed.test.ts` asserting the counts above
- [ ] T094 Run seed test + verify `docker compose up --build` on a clean volume logs in as each seeded role (quickstart.md §2)
- [ ] T095 Quality gate for Phase 9 (no `/code-review` step)
- [ ] T096 Commit Phase 9: `feat: seed script and sample-data spreadsheets`

---

## Phase 10: Hardening / break-it pass

**Goal**: Deliberately attempt every constitution Principle II scenario and every lock/permission bypass; fix what breaks. **Touches scoring/timing/attempts/auth → the whole phase is adversarial testing.**

- [ ] T097 [P] Add adversarial integration tests: two-tab / double-submit race (one attempt only), forged client score/`is_correct` on submit ignored (FR-011), device-clock tampering has no effect, late submit beyond grace auto-finalizes (quickstart.md §10)
- [ ] T098 [P] Add lock/permission bypass tests: edit quiz after attempt refused (FR-024), unpublish after attempt refused (FR-004a), review-before-close 403 (FR-010), student accessing another class's quiz 404, non-owner teacher accessing results 403
- [ ] T099 Fix every issue surfaced by T097/T098; re-run the full suite
- [ ] T100 Quality gate for Phase 10 (includes `/code-review` medium — this phase touches scoring/timing/attempts/auth directly)
- [ ] T101 Commit Phase 10: `test: hardening pass for bad-behaviour and permission scenarios`

---

## Phase 11: Docs

**Goal**: Bring delivery docs current and run the project-end reviews.

- [ ] T102 [P] Write/refresh `README.md`: one-command run, sample-data loading, demo logins for student/teacher/admin — verified exact against the seed (quickstart.md §2)
- [ ] T103 [P] Reconcile `DECISIONS.md` and `specs/001-quiz-app-core/traceability.md` against what was actually built (every planned test name now exists or is noted)
- [ ] T104 Write `AI_USAGE.md` from `notes/ai-log.md` — factual only, no claimed checks that didn't happen (CLAUDE.md)
- [ ] T105 Run `/code-review` at high effort on the full codebase and `/security-review`; fix confirmed findings; log findings + fixes in `notes/ai-log.md` (CLAUDE.md project-end quality steps)
- [ ] T106 Final quality gate (full lint + test suite green) and commit Phase 11: `docs: README, DECISIONS, AI_USAGE, and final review`

---

## Dependencies & Execution Order

### Phase order (strict — per plan.md)

- **Phase 1** (Scaffold) → blocks everything.
- **Phase 2** (Auth + i18n) → blocks all UI phases (5, 6, 7, 8) and needs Phase 1.
- **Phase 3** (Scoring) → needed by Phase 4 (submit calls scoring).
- **Phase 4** (Attempt API) → needs Phases 1–3; blocks Phase 5.
- **Phase 5** (Student UI) → needs Phases 2 + 4.
- **Phase 6** (Teacher editor + import) → needs Phases 2 + 3 (quiz/question schemas, scoring shape).
- **Phase 7** (Results) → needs Phases 4 + 6 (attempts + quizzes to report on).
- **Phase 8** (Admin) → needs Phase 2; independent of 5–7 except shared UI primitives.
- **Phase 9** (Seed) → best after 6 + 8 (needs quiz/user/class shapes stable).
- **Phase 10** (Hardening) → needs the features it attacks (2, 4, 6, 7, 8) present.
- **Phase 11** (Docs) → last.

### Within a test-first phase

Test tasks (listed first) MUST be written and failing before the implementation tasks in the same phase (constitution Principle VI). The quality-gate task is always the penultimate task of a phase; the commit task is always last.

### Parallel opportunities

- **Phase 1**: T002/T003/T004/T005 (separate workspaces), T008/T009 parallel after T001.
- **Phase 2**: T013/T014/T015 (tests) parallel; T016/T017 and T025/T026 parallel.
- **Phase 4**: T037/T038 (tests) parallel; T040 parallel with T039.
- **Phase 8**: T078/T079/T080 (tests) parallel; T081/T082 parallel.
- Across phases: none — the phase order is strict per the owner's sequencing.

## Implementation Strategy

- **MVP = Phases 1–5**: a student can log in (bilingual) and take a fully server-scored, single-attempt, timed quiz end to end — the P1 user story and the entire reason for the product. Phases 6–11 layer authoring, results, admin, seed realism, hardening, and docs on top.
- **Test-first is mandatory in phases 2, 3, 4, 6, 8** (auth/scoring/timing/attempts/imports) — the test tasks are listed before implementation and must fail first.
- **Every implementation phase ends with the CLAUDE.md quality gate then a commit** — never commit a phase before the gate passes; the project-end high-effort `/code-review` + `/security-review` run in Phase 11.
