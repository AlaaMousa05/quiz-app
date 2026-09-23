# Quiz app - Nour's tutoring centre

Source of truth for requirements: docs/brief.md (client brief + assessment rules). Re-read it before planning any phase.

## Stack
React + Vite + TypeScript + Tailwind (client/), Express + TypeScript + Prisma + PostgreSQL + Zod (server/), Vitest + Supertest, Docker Compose.

## Commands
- Run everything: `docker compose up --build`
- Server tests: `cd server && npm test`
- Reset + seed DB: `cd server && npm run seed`
(Keep this list accurate as scripts are added.)

## Non-negotiable rules
- The server is the only authority on time, attempts and scoring. Never trust client timestamps, attempt status or scores.
- Handle and test bad behaviour: double submits, refreshes mid-attempt, the same quiz open in two tabs, late submits after the quiz window closes, and tampered requests.
- Never send `is_correct` (or anything that reveals it) to a student before the attempt is submitted.
- One attempt per student per quiz is enforced by a DB unique constraint, not only app code.
- Every route checks role AND ownership (student -> own class, teacher -> own quizzes).
- Validate every request body with Zod.
- Store times in UTC; display in Asia/Amman.
- Scores use Decimal, never JS floats.
- Every user-facing text element that may contain Arabic uses dir="auto"; keep layouts RTL-safe.
- Mobile-first UI: design at 375px width, tap targets >= 44px.
- Simplicity: one Postgres DB, one app container unless there's a documented need otherwise. No feature without a reason written in DECISIONS.md.

## Code structure and quality

### General
- SOLID applied pragmatically: single responsibility per file/function, dependencies injected where it enables testing (clock, repositories), no abstraction without a second use or a testing need. No over-engineering: no interface per class, no factories or patterns "just in case".
- Soft limits: a file ~200 lines, a React component ~150 lines, a function ~40 lines. If exceeded, split by responsibility.
- TypeScript strict mode, no `any`, no non-null assertions without a comment.
- ESLint + Prettier configured; `npm run lint` must pass before every commit.
- Clear names over comments. Comments explain why, not what.

### Monorepo
- npm workspaces: client/, server/, shared/.
- shared/ holds the Zod schemas and TypeScript types used by both client and server (request/response contracts), so validation rules are defined once.
- client/ never imports from server/, and server/ never imports from client/.

### Backend layers (server/src)
- routes/: HTTP wiring only (path, middleware, controller).
- controllers/: parse and validate the request with Zod, call one service, map the result to the HTTP response. No business logic, no Prisma.
- services/: all business rules (scoring, attempts, timing, imports, permissions checks on ownership). No req/res objects. Pure where possible; time comes from an injected clock.
- repositories/: the only place that talks to Prisma. Services depend on repositories, not on Prisma directly.
- middleware/: auth, role guards, error handler, rate limiting.
- errors/: typed domain errors (NotFound, Forbidden, Conflict, ValidationError, DeadlinePassed). One central error handler maps them to HTTP codes and i18n message keys.
- config/: environment variables validated with Zod at startup.

### Frontend structure (client/src)
- features/<feature>/ (auth, student-quiz, quiz-editor, results, admin-classes, admin-users), each with:
  - api/: request functions and TanStack Query hooks. The only place that calls the server.
  - hooks/: feature logic and state (e.g. useQuizTimer, useAutosave, useImportPreview). No JSX.
  - components/: presentational components. They receive props, render UI and emit events. No fetching, no business logic.
  - pages/: thin route components that compose hooks and components.
- components/ui/: shared design-system primitives (Button, Card, Field, Dialog, Table, Badge, Timer display, LanguageToggle). Styling lives here, so feature components rarely need long class lists.
- lib/: api client, i18n (dictionaries + provider), date/time formatting for Asia/Amman, Arabic text helpers.
- routes/: router and role-based route guards.
- Logic and view are always separated: if a component needs state or effects beyond trivial UI state, move them into a hook.

### Tests
Tests mirror the source structure: services are unit-tested, routes get Supertest integration tests, hooks with complex logic (timer, autosave) get tests.

## Workflow
- Write tests before changing scoring, timing, attempt or permission logic.
- Run tests before every commit.

## Documentation duties (end of every phase, before committing)
- README.md: keep run commands, seed instructions and demo logins exactly accurate. If ports, env vars, scripts or seed users change, update README in the same commit.
- DECISIONS.md: every assumption made or approved goes under the right section (Assumptions / Built but not asked for / Deliberately left out / Next week) with a one-line why.
- notes/ai-log.md: append one entry per phase:
  - Phase + date
  - What I asked for (short summary)
  - What you produced (files, approach)
  - What went wrong or needed correction (honest: failing tests, wrong assumptions, my corrections)
  - How it was verified (tests run, manual checks)
  - "My notes:" left empty for me to fill in. Never invent my opinions.
- AI_USAGE.md: written only in the final phase, built from notes/ai-log.md. Factual only; never claim checks that did not happen.

## Commits
- Small commits with conventional messages (feat:, fix:, test:, docs:, chore:).
- Never push without asking me.
