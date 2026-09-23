# Implementation Plan: Quiz App Core (Clickable MVP)

**Branch**: `001-quiz-app-core` | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-quiz-app-core/spec.md`, screen inventory from `ui.md`, requirement traceability from `traceability.md`, and an explicit stack/architecture brief from the project owner (see conversation input).

## Summary

Build the clickable MVP described in `spec.md`: students take a timed, server-scored, single-attempt multiple-choice quiz; teachers author and publish quizzes (or import them from a spreadsheet) with an optional negative-marking scheme; admin manages classes, users, and bulk imports; everyone gets a fully bilingual (English/Arabic, RTL-correct) mobile-first UI. Technical approach: a three-workspace npm monorepo (`client/`, `server/`, `shared/`) — React/Vite/Tailwind SPA served by an Express API backed by a single PostgreSQL database, run as two Docker Compose services (`db`, `app`); business rules live in server-side services with an injected clock for testability, request/response contracts are Zod schemas defined once in `shared/` and consumed by both sides, and every layering/size rule from CLAUDE.md's "Code structure and quality" section and constitution Principle IX is encoded directly into the folder structure and lint config below.

## Technical Context

**Language/Version**: TypeScript 5.x throughout; Node.js 20 LTS (server), React 18 (client).

**Primary Dependencies**: Client — React, Vite, React Router, TanStack Query, Tailwind CSS, `@fontsource/noto-sans` + `@fontsource/noto-sans-arabic`. Server — Express, Prisma, Zod, `express-session` + `connect-pg-simple`, `bcrypt`, `exceljs`, `csv-parse`. Shared — Zod. Test — Vitest, Supertest.

**Storage**: PostgreSQL 16 via Prisma, one database, one schema — also hosts `express-session`'s session table (Simplicity principle: no separate session store like Redis).

**Testing**: Vitest for unit tests (services, hooks) and Supertest for HTTP integration tests, both run against a real Postgres test database (constitution Principle II/VI — no DB mocking, since that would hide the exact unique-constraint/transaction bugs those principles exist to catch).

**Target Platform**: Docker Compose, two Linux containers (`db`, `app`); in production mode the `app` container's Express process serves the built React static assets and the API from one process/port, so `docker compose up --build` is the single run command (Delivery Constraints).

**Project Type**: Web application — npm-workspaces monorepo (`client/`, `server/`, `shared/`), not a generic single-project or mobile layout.

**Performance Goals**: Interactive on a mid-range phone over a typical school Wi-Fi/4G connection; API reads p95 < 300ms and writes (autosave, submit) p95 < 500ms at seed-data scale (~60 students, a handful of quizzes) — generous headroom below anything that would make the sticky quiz timer feel laggy, without inventing a load-testing requirement the brief never asked for.

**Constraints**: Single Postgres database, single app container (constitution Principle VII); no email/external network dependency (Out of Scope in spec.md — includes the self-hosted font requirement, FR-037); mobile-first at 375px with 44px tap targets (Principle IV); server is the sole authority on time/attempts/scoring (Principle I) — realized here via the injected-clock pattern (research.md) so this is testable, not just asserted.

**Scale/Scope**: Seed/demo scale per spec.md's Assumptions (3 classes, ~20 students each, 4 teachers, 1–2 quizzes at 15 questions); architecture has no hard ceiling below the brief's real-world target (~300 students, 12 teachers) since nothing here is O(n²) or memory-resident beyond one import file at a time. 19 screens (`ui.md`), ~50 functional requirements (`spec.md`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design (see note at the end of this section).*

| Principle | Compliance in this plan |
|---|---|
| I. Server Is the Single Source of Truth | `Attempt.startedAt`/`deadlineAt` are server-clock values (via injected `Clock`, research.md), never client-submitted; scoring happens only in `services/scoring.service.ts` from stored answers; all `Decimal` columns, no floats (data-model.md). |
| II. Correctness Under Bad Behaviour | `Attempt` has a DB-level `@@unique([quizId, studentId])` (data-model.md) — the actual mechanism behind "can't be bypassed by retrying/refreshing/two tabs." Tests run against real Postgres specifically so this constraint's behavior under a race is exercised, not mocked away (research.md). Phase 4 (attempt lifecycle) and Phase 10 (hardening/break-it pass) are dedicated to this principle. |
| III. Least Privilege on Every Endpoint | Every contract in `contracts/` states its role requirement and, where applicable, its ownership check (e.g., `teacher-quizzes.md`'s `ownerTeacherId === session.userId`); `middleware/` centralizes both checks so no route can skip them by omission. |
| IV. Mobile-First | `ui.md` wireframes are drawn mobile-first at 375px with 44px targets; Tailwind config restricted to logical properties (below) enforces this doesn't regress under RTL. |
| V. Arabic Is First-Class | `dir="auto"` on content, `dir="rtl"` + logical-properties-only Tailwind on the shell, self-hosted Noto Sans Arabic, and a stored `nameNormalized` column for FR-038 search — all per research.md/data-model.md. |
| VI. Tests First for Scoring, Timing & Attempt Rules | Phases 3 and 4 are explicitly TDD (scoring, then attempt lifecycle) and come *before* any UI phase — tasks.md (next command) will order individual tasks so tests are written and failing before the corresponding service code. |
| VII. Simplicity | Two Docker Compose services total (`db`, `app`); no Redis, no message queue, no microservices; import preview is computed in-memory rather than staged in a new table (research.md) — each is a deliberate "don't add a moving part without a need" choice. |
| VIII. Every Assumption Is Written Down | Two new implementation-level assumptions surfaced during this plan (no "unpublish," no "re-archive to active" transition) are recorded in research.md/data-model.md with a rationale and flagged as `DECISIONS.md` "Next week" candidates once built. |
| IX. Clean, Layered, Small Units | See **Project Structure** below — this is the principle the folder structure and lint config exist specifically to satisfy; verified line-by-line beneath the tree. The end-of-phase **Quality gate** (CLAUDE.md) step 4 re-checks the size limits and layering (no Prisma outside `repositories/`, no fetch outside feature `api/`, no logic in presentational components) on every phase's changes and splits anything that broke them, so compliance is enforced continuously rather than only asserted here. |
| Delivery & Documentation Constraints | Stack matches exactly (React/Vite/TS/Tailwind, Express/TS/Prisma/Postgres/Zod, Vitest/Supertest, Docker Compose); Zod validates every request body (`shared/` schemas, used in `controllers/`); UTC storage / Amman display via `lib/datetime.ts` (client) and stored `timestamptz` (server). A root `npm run lint` script (ESLint + Prettier, fanning out to both workspaces) must pass before every commit, per CLAUDE.md. |
| Workflow & Commit Discipline | Phases below are ordered so each is committable on its own (small, conventional commits) rather than one final drop. Each phase ends by running the **Quality gate** (CLAUDE.md) — lint + tests, `/simplify`, `/code-review` (medium) on any phase touching scoring/timing/attempts/auth/imports, structure re-check, lint + tests again, and an `ai-log.md` entry — before its final commit. |

**Result**: PASS. No violations requiring the Complexity Tracking table.

*Post-Phase-1 re-check: `data-model.md` and `contracts/` (Phase 1 outputs) introduce no new dependency, service, or infrastructure beyond what's justified above — still PASS, no new entries needed here.*

*Quality-gate re-check (added in the plan revision that followed CLAUDE.md's new "Code structure and quality" and "Quality gate" sections and constitution Principle IX): the plan already used the layered folder structure, `shared/` Zod contracts, and ESLint size rules from those sections (it was written just after they were committed), so nothing structural changed on re-check; the one gap was that the phase list did not yet name the end-of-phase quality gate — now added to every phase and to the two Constitution Check rows above. Still PASS.*

## Project Structure

### Documentation (this feature)

```text
specs/001-quiz-app-core/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/            # Phase 1 output
│   ├── auth.md
│   ├── student-quizzes.md
│   ├── teacher-quizzes.md
│   ├── imports.md
│   ├── admin-classes.md
│   ├── admin-users.md
│   └── admin-scope.md
├── ui.md                 # Screen inventory & design system (prior command)
├── traceability.md       # Brief → FR → screen → test map (prior command)
└── tasks.md              # Phase 2 output (/speckit-tasks — not created by this command)
```

### Source code (repository root)

**Structure Decision**: npm-workspaces monorepo with three workspaces (`client/`, `server/`, `shared/`) — the "Web application" shape from the plan template, made concrete per CLAUDE.md's "Code structure and quality" section and constitution Principle IX. No `src/`-at-root single-project layout and no mobile/API split apply here.

```text
quiz-app/
├── package.json                    # workspace root: "workspaces": ["client","server","shared"]
├── docker-compose.yml               # services: db, app
├── Dockerfile                       # builds client, then server, single "app" image
├── .env.example
│
├── shared/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── schemas/                 # single source of request/response contracts (Principle IX)
│       │   ├── auth.schema.ts
│       │   ├── quiz.schema.ts
│       │   ├── question.schema.ts
│       │   ├── attempt.schema.ts
│       │   ├── import.schema.ts
│       │   ├── class.schema.ts
│       │   └── user.schema.ts
│       ├── i18n/
│       │   ├── en.ts                 # typed dictionary
│       │   └── ar.ts                 # typed against `Record<keyof typeof en, string>`
│       └── arabicName.ts             # normalizeArabicName() — used by server (write) and, if ever needed, client
│
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .eslintrc.cjs                 # max-lines 200, max-lines-per-function 40, no-explicit-any, no-non-null-assertion
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   ├── seed.ts                   # Phase 9: reads sample-data/, only runs if User count is 0
│   │   └── sample-data/
│   │       ├── students.xlsx
│   │       ├── teachers.csv
│   │       └── quiz-week4.xlsx
│   ├── src/
│   │   ├── app.ts                    # Express app assembly (middleware + routes), exported for Supertest
│   │   ├── server.ts                 # process entrypoint: listen(), runs on `npm start`
│   │   ├── config/
│   │   │   └── env.ts                # process.env validated with Zod at startup
│   │   ├── routes/                   # HTTP wiring only — path + middleware + controller, no logic
│   │   │   ├── auth.routes.ts
│   │   │   ├── student-quizzes.routes.ts
│   │   │   ├── teacher-quizzes.routes.ts
│   │   │   ├── imports.routes.ts
│   │   │   ├── admin-classes.routes.ts
│   │   │   ├── admin-users.routes.ts
│   │   │   └── admin-scope.routes.ts
│   │   ├── controllers/              # parse+validate (Zod) → call one service → map to HTTP response
│   │   │   ├── auth.controller.ts
│   │   │   ├── student-quizzes.controller.ts
│   │   │   ├── teacher-quizzes.controller.ts
│   │   │   ├── imports.controller.ts
│   │   │   ├── admin-classes.controller.ts
│   │   │   └── admin-users.controller.ts
│   │   ├── services/                 # all business rules; no req/res; time via injected Clock
│   │   │   ├── clock.ts              # Clock interface + SystemClock
│   │   │   ├── auth.service.ts
│   │   │   ├── scoring.service.ts    # Phase 3 (TDD)
│   │   │   ├── attempt.service.ts    # Phase 4 (TDD) — deadline/grace/lock logic
│   │   │   ├── quiz.service.ts
│   │   │   ├── import.service.ts     # encoding validation, row parsing, dedup
│   │   │   ├── class.service.ts
│   │   │   ├── user.service.ts
│   │   │   └── arabicSearch.service.ts
│   │   ├── repositories/             # the only place that talks to Prisma
│   │   │   ├── user.repository.ts
│   │   │   ├── class.repository.ts
│   │   │   ├── quiz.repository.ts
│   │   │   ├── attempt.repository.ts
│   │   │   └── importBatch.repository.ts
│   │   ├── middleware/
│   │   │   ├── session.middleware.ts # express-session + connect-pg-simple wiring
│   │   │   ├── requireAuth.middleware.ts
│   │   │   ├── requireRole.middleware.ts
│   │   │   ├── requireOwnership.middleware.ts
│   │   │   ├── errorHandler.middleware.ts   # maps errors/ → HTTP codes + i18n message keys
│   │   │   └── rateLimit.middleware.ts
│   │   └── errors/
│   │       ├── DomainError.ts
│   │       ├── NotFoundError.ts
│   │       ├── ForbiddenError.ts
│   │       ├── ConflictError.ts
│   │       ├── ValidationError.ts
│   │       ├── DeadlinePassedError.ts
│   │       └── index.ts
│   └── tests/
│       ├── unit/                     # mirrors services/
│       │   ├── scoring.service.test.ts
│       │   ├── attempt.service.test.ts
│       │   ├── import.service.test.ts
│       │   └── arabicSearch.service.test.ts
│       └── integration/              # mirrors routes/, Supertest against real test Postgres
│           ├── auth.routes.test.ts
│           ├── student-quizzes.routes.test.ts
│           ├── teacher-quizzes.routes.test.ts
│           ├── imports.routes.test.ts
│           ├── admin-classes.routes.test.ts
│           └── admin-users.routes.test.ts
│
├── client/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts            # logical properties only; no left/right utilities enabled
│   ├── .eslintrc.cjs
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── routes/
│       │   ├── router.tsx
│       │   └── RoleGuard.tsx
│       ├── lib/
│       │   ├── apiClient.ts
│       │   ├── datetime.ts           # Asia/Amman formatting, per active language
│       │   ├── i18n/
│       │   │   ├── I18nProvider.tsx
│       │   │   └── useTranslation.ts
│       │   └── arabicText.ts         # dir=auto helpers, re-exports shared/arabicName where useful
│       ├── components/ui/            # design-system primitives (ui.md §1)
│       │   ├── Button.tsx
│       │   ├── Card.tsx
│       │   ├── Field.tsx
│       │   ├── Dialog.tsx
│       │   ├── Table.tsx             # collapses to cards below 640px (ui.md §1.8)
│       │   ├── Badge.tsx
│       │   ├── TimerDisplay.tsx      # normal/warning/danger states (ui.md §1.11)
│       │   └── LanguageToggle.tsx
│       └── features/
│           ├── auth/                 {api/, hooks/, components/, pages/}      # S1
│           ├── student-quiz/         {api/, hooks/, components/, pages/}      # S2–S7
│           │   └── hooks/            useQuizTimer.ts, useAutosave.ts
│           ├── quiz-editor/          {api/, hooks/, components/, pages/}      # T1–T4
│           │   └── hooks/            useImportPreview.ts
│           ├── results/              {api/, hooks/, components/, pages/}      # T5, A6, A7
│           ├── admin-classes/        {api/, hooks/, components/, pages/}      # A2, A3
│           └── admin-users/          {api/, hooks/, components/, pages/}      # A1, A4, A5
│   └── tests/
│       ├── hooks/                    # useQuizTimer, useAutosave, useImportPreview — real logic, tested
│       └── components/               # only where a component has non-trivial conditional rendering
│
└── (root-level docs already present: CLAUDE.md, DECISIONS.md, README.md, AI_USAGE.md, docs/, specs/, notes/)
```

**Constitution Principle IX verification against this tree**:

- *Layering enforced by direction of imports*: `routes/` → `controllers/` → `services/` → `repositories/` → Prisma, one direction only; a `service` never imports a `controller`, a `repository` never imports a `service`. `client/` and `server/` have no import path between them (Principle IX, Delivery Constraints) — the only thing they share is `shared/`, imported by both as a workspace dependency.
- *Single-responsibility split*: `controllers/` do parsing+response-mapping only (no Prisma import allowed there — enforced by code review since a lint rule can't easily forbid an import per-directory without extra tooling not otherwise needed here); `services/` hold business rules and are Prisma-free (they call `repositories/`, never `@prisma/client` directly); `repositories/` are the only files that import `@prisma/client`.
- *No premature abstraction*: no per-entity interface layer above the repositories (a repository's public function signatures are the contract; nothing else consumes them); no factory/strategy pattern anywhere in the tree above — every service is a plain module of functions.
- *Dependency injection limited to testing need*: the only injected dependency is `Clock` (research.md), because it's the one thing that must vary between production and tests; repositories are imported directly by services (not injected via a container), since there is exactly one implementation of each and no test currently needs to swap it out — consistent with "DI where it enables testing... no abstraction without a second use."
- *Size limits*: enforced by `.eslintrc.cjs`'s `max-lines`/`max-lines-per-function` in both `client/` and `server/` (research.md's "Lint/tooling enforcement" section); `npm run lint` (root script fanning out to both workspaces) must pass before every commit per CLAUDE.md.
- *Shared contract, one definition*: every Zod schema lives in `shared/src/schemas/`; `controllers/` and `client/.../api/` both import from there — never a second, hand-copied type on either side.
- *Tests mirror structure*: `server/tests/unit/` mirrors `services/`, `server/tests/integration/` mirrors `routes/`, `client/tests/hooks/` covers exactly the hooks named in CLAUDE.md's example (`useQuizTimer`, `useAutosave`) plus `useImportPreview`.

## Implementation Phases

Ordered per the project owner's explicit sequencing; each phase is independently committable (Workflow & Commit Discipline) and phases 3–4 precede any UI work per constitution Principle VI (test-first for scoring/timing/attempt logic). `/speckit-tasks` will break each phase into individually-checkable tasks.

**Every phase ends with the Quality gate** (CLAUDE.md, "Quality gate (end of every implementation phase)") before its final commit: run lint + all tests; run `/simplify` on the phase's changes and apply fixes; for any phase touching scoring, timing, attempts, auth/permissions, or imports (phases 3, 4, 6, 7, 8, and the auth part of 2) also run `/code-review` at medium effort and fix every confirmed finding; re-check the "Code structure and quality" rules (file/function size, no Prisma outside `repositories/`, no fetch outside feature `api/`, no logic in presentational components) and split anything that broke them; re-run lint + tests; and record what `/simplify` and `/code-review` found and changed in `notes/ai-log.md` (including any finding deliberately not fixed, with the reason). The final phase additionally runs `/code-review` at high effort and `/security-review` on the full codebase. `/speckit-tasks` will emit this gate as the closing task(s) of each phase.

1. **Scaffold + Docker + schema** — npm workspaces (`client/`, `server/`, `shared/`), `docker-compose.yml` (`db`, `app`), Prisma schema from `data-model.md`, initial migration, ESLint/Prettier configs with the size-limit rules from research.md, base Express app skeleton and Vite app skeleton wired to build/serve from one container.
2. **Auth + roles + i18n shell** — session middleware (`connect-pg-simple`), login/logout/me endpoints (`contracts/auth.md`), `requireAuth`/`requireRole`/`requireOwnership` middleware, `shared/src/i18n/{en,ar}.ts` + `I18nProvider` + the key-parity test (research.md), language toggle wired to `<html dir/lang>`, role-based route guard shell (no real pages yet, just the guarded shell).
3. **Scoring (TDD)** — `services/scoring.service.ts` unit tests written first (correct/incorrect/unanswered, negative-marking fraction, floor-at-zero) per constitution Principle VI, then the implementation.
4. **Attempt lifecycle API (TDD)** — `services/attempt.service.ts` + `attempt.repository.ts` tests first (start/duplicate-block/deadline/grace/autosave/auto-finalize), covering the constitution Principle II bad-behavior list explicitly, then `contracts/student-quizzes.md`'s endpoints.
5. **Student UI** — S1–S7 (`ui.md`) built against the now-real API from phases 2–4: login, My Quizzes, Quiz Intro, Taking Quiz (timer/autosave/grid), Submit Confirmation, Result, Review.
6. **Teacher quiz editor + import** — T1–T4: quiz settings, questions editor (with the exactly-4-options/1-correct validation), publish, and `contracts/imports.md`'s quiz-import preview/confirm flow.
7. **Results + CSV export** — T5, plus `contracts/admin-scope.md`'s admin-unfiltered reuse of the same screen (A6/A7).
8. **Admin classes + users + import** — A2–A5: class CRUD/archive/move-student, user CRUD/reset/deactivate, and the student/teacher import preview/confirm flow.
9. **Seed + sample-data spreadsheets** — `prisma/seed.ts` and `prisma/sample-data/*` realistic fixtures (3 classes, ~20 students each with Arabic names, 4 teachers, a 15-question quiz including an Arabic one) matching spec.md's Assumptions; wired to run automatically on empty-DB container start (research.md).
10. **Hardening / break-it pass** — deliberately attempt every constitution Principle II scenario (double-submit, two tabs, late submit, forged score/is_correct, clock tampering) and every FR-024 lock-bypass attempt; fix whatever breaks; this is also where `quickstart.md` §10 gets run for real.
11. **Docs** — bring README.md, DECISIONS.md, and AI_USAGE.md up to date with what was actually built (per CLAUDE.md's documentation duties), reconciling against `traceability.md`. This phase also carries the project-end quality steps: `/code-review` at high effort and `/security-review` across the full codebase, with findings and fixes logged in `notes/ai-log.md`.

## Complexity Tracking

*No entries — the Constitution Check above found no violations to justify.*
