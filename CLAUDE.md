# Quiz app - Nour's tutoring centre

## Stack
React + Vite + TypeScript + Tailwind (client/), Express + TypeScript + Prisma + PostgreSQL + Zod (server/), Vitest + Supertest, Docker Compose.

## Commands
- Run everything: `docker compose up --build`
- Server tests: `cd server && npm test`
- Reset + seed DB: `cd server && npm run seed`
(Keep this list accurate as scripts are added.)

## Non-negotiable rules
- The server is the only authority on time and scoring. Never trust client timestamps or scores.
- Never send `is_correct` (or anything that reveals it) to a student before the attempt is submitted.
- One attempt per student per quiz is enforced by a DB unique constraint, not only app code.
- Every route checks role AND ownership (student -> own class, teacher -> own quizzes).
- Validate every request body with Zod.
- Store times in UTC; display in Asia/Amman.
- Scores use Decimal, never JS floats.
- Every user-facing text element that may contain Arabic uses dir="auto".
- Mobile-first UI: design at 375px width, tap targets >= 44px.

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
