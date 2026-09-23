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

Session-based login (`POST /api/auth/login`, cookie-based, `httpOnly`) exists for all three roles (ADMIN/TEACHER/STUDENT); role-guarded landing pages exist for each at `/student`, `/teacher`, `/admin`. The UI is bilingual (English/Arabic, RTL) — toggle the language from the button on the login screen or any role home screen; the choice persists per device (`localStorage`) and the browser's language is used as the default on first visit.
