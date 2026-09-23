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
