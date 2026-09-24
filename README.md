# Quiz App

A clickable MVP quiz platform for Nour's tutoring centre. See `docs/brief.md` for the client brief and `specs/001-quiz-app-core/` for the spec, plan, and tasks.

## Stack

React + Vite + TypeScript + Tailwind (`client/`), Express + TypeScript + Prisma + PostgreSQL + Zod (`server/`), shared Zod contracts (`shared/`), Vitest + Supertest, Docker Compose.

## Run everything

```
docker compose up --build
```

This builds a single `app` image (client + server) and starts it alongside a `db` (PostgreSQL) container. The app serves both the API and the built client on:

- http://localhost:3000

On first start against an empty database, the container runs pending Prisma migrations and then the seed script (`server/prisma/seed.ts`) — the seed currently skips itself once any user exists, and has no sample data yet (sample fixtures land in a later phase; see `notes/ai-log.md`).

## Demo logins

No seed users exist yet — sample data (students/teachers/admin, seeded classes) will be added in a later phase. This section will be filled in once real fixtures exist.

## Local development (without Docker)

```
npm install
npm run dev      # builds shared/, then starts the server with hot reload
```

Requires a local PostgreSQL instance; copy `.env.example` to `server/.env` and point `DATABASE_URL` at it.

## Commands

- Run everything: `docker compose up --build`
- Install all workspace dependencies: `npm install`
- Lint all workspaces: `npm run lint`
- Test all workspaces: `npm run test`
- Build all workspaces: `npm run build`
- Reset + seed DB: `npm run seed` (from `server/`, requires `DATABASE_URL` set)

## Running server tests

`server`'s integration tests hit a real Postgres database (constitution Principle II/VI — no DB mocking). One-time setup, a dedicated test database on port 55432:

```
docker run -d --name quizapp-test-db -e POSTGRES_USER=quizapp -e POSTGRES_PASSWORD=quizapp -e POSTGRES_DB=quizapp_test -p 55432:5432 postgres:16-alpine
```

`server/.env.test` (gitignored, already configured to point at that container) is picked up automatically by `npm run test --workspace=server` (or the root `npm run test`), which applies pending migrations and then runs the suite.

## Auth + i18n (Phase 2)

Session-based login (`POST /api/auth/login`, cookie-based, `httpOnly`) exists for all three roles (ADMIN/TEACHER/STUDENT); role-guarded landing pages exist for each (`STUDENT` lands on `/quizzes` as of Phase 5 — see below; `/teacher` and `/admin` are still placeholders). The UI is bilingual (English/Arabic, RTL) — toggle the language from the button on the login screen or any role home screen; the choice persists per device (`localStorage`) and the browser's language is used as the default on first visit.

## Student quiz-taking API (Phase 4)

Server-authoritative attempt lifecycle for STUDENT accounts, mounted under `/api` (see `specs/001-quiz-app-core/contracts/student-quizzes.md` for full request/response shapes):

- `GET /api/quizzes` — the student's own class's published quizzes, bucketed into open/upcoming/done.
- `GET /api/quizzes/:quizId` — quiz intro (time limit, points, negative-marking config); 404 for a draft, nonexistent, or other-class quiz.
- `POST /api/quizzes/:quizId/attempts` — start an attempt; 409 if one already exists (DB-unique-constraint-backed), 403 outside `[opensAt, closesAt]`.
- `GET /api/attempts/:attemptId` — resume: current answers, remaining time, never the correct option.
- `PATCH /api/attempts/:attemptId/answers` — autosave one answer; 409 more than 10s past the deadline, 410 if already finalized.
- `POST /api/attempts/:attemptId/submit` — server-computed score from stored answers only; same 409/410 rules.
- `GET /api/attempts/:attemptId/result` — score only; lazily auto-finalizes an expired, never-submitted attempt on first read.
- `GET /api/attempts/:attemptId/review` — per-question breakdown; 403 until the quiz has closed *and* this attempt can no longer be submitted.

No client is wired to these yet (client UI lands in Phase 5) — exercise them with `curl`/Postman or the integration tests under `server/tests/integration/student-quizzes.*.test.ts`.

## Student quiz-taking UI (Phase 5)

The screens above are now wired to real browser routes for STUDENT accounts:

- `/quizzes` — S2 My Quizzes (Open/Upcoming/Done tabs).
- `/quizzes/:quizId` — S3 Quiz Intro (Start or Continue an existing in-progress attempt).
- `/quizzes/:quizId/attempt` — S4 Taking Quiz (sticky timer, one-question view, jump grid, autosave) and S5's submit-confirmation dialog. The attempt id isn't part of the URL (matching the quiz-scoped route in ui.md); it's carried via router state right after Start, or resolved from the quiz intro's `attemptId` field on a refresh/direct link.
- `/quizzes/:quizId/result` — S6 Result (score only, pre-close).
- `/quizzes/:quizId/review` — S7 Review (per-question breakdown, post-close only).

Timer state, autosave (with offline/retry), and the "never extend the countdown" rule (FR-008) are unit-tested in `client/tests/hooks/`. No headless-browser click-through was run this session (no browser-automation tool was available) — verified instead via `tsc`/`vite build`, the full test suite, and `curl` against the rebuilt `docker compose` image confirming the API response shapes each screen expects (see `notes/ai-log.md`).

## Teacher quiz editor + import (Phase 6)

Server, mounted under `/api/teacher` (own = the logged-in teacher; non-owner requests read as 403, no existence leak) and `/api/imports`:

- `GET /api/teacher/classes` — active classes, for the class picker.
- `GET/POST /api/teacher/quizzes`, `GET/PATCH /api/teacher/quizzes/:quizId` — settings; once a quiz has an attempt, `PATCH` refuses every field except `opensAt`/`closesAt` (409, FR-024).
- `POST/PATCH/DELETE /api/teacher/quizzes/:quizId/questions[/:questionId]` — exactly 4 options, exactly 1 correct, positive points (400 otherwise); refused once the quiz is locked.
- `POST /api/teacher/quizzes/:quizId/publish` (400 with zero questions) / `.../unpublish` (409 once locked, per FR-004a).
- `POST /api/imports/quiz/preview` and `.../confirm` — `multipart/form-data`, one `.xlsx`/`.csv` (UTF-8) file with fixed columns `Question, Points, OptionA, OptionB, OptionC, OptionD, Correct`; preview never persists, confirm re-parses the re-uploaded file and creates the quiz as a draft.

Client routes for TEACHER accounts: `/teacher` (T1 My Quizzes), `/teacher/quizzes/new` and `/teacher/quizzes/:quizId/settings` (T2), `/teacher/quizzes/:quizId/questions` (T3, publish/unpublish), `/teacher/quizzes/import` (T4).

Building this phase surfaced and fixed a real pre-existing bug: `student-quizzes.routes.ts`'s router-level `requireRole("STUDENT")` was intercepting every request under the shared `/api` mount prefix — including the new `/api/teacher/*` and `/api/imports/*` routes — before Express ever tried to match them elsewhere. Fixed by moving the guard to per-route middleware. See `notes/ai-log.md` for details.

## Results + CSV export (Phase 7)

- `GET /api/teacher/quizzes/:quizId/results` and `.../export.csv` — class average, per-question % correct, and each enrolled student's status (`NOT_STARTED`/`IN_PROGRESS`/`SUBMITTED`/`AUTO_FINALIZED`) and score. An expired-but-unread attempt is lazily finalized here too, so results are never stale even if the student never re-opens it.
- `GET /api/admin/quizzes`, `GET /api/admin/quizzes/:quizId/results` and `.../export.csv` — identical shapes, unfiltered by owner (ADMIN role only) — the exact same `quizResults.service.ts` as the teacher routes, per FR-031c's "same screens, different guard."

Client: `/teacher/quizzes/:quizId/results` (T5), `/admin/quizzes` (A6), `/admin/results` (A7, grouped by class) — all three render the same `QuizResultsPage` component.
