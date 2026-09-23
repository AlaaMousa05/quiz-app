# Phase 0 Research: Quiz App Core

All technology choices were specified directly by the project owner (see plan input); this document records the rationale, alternatives considered, and the handful of implementation-level decisions needed to turn those choices into a concrete build — not open technology questions. No `NEEDS CLARIFICATION` markers remain.

## Stack choices (as specified)

| Area | Decision | Rationale | Alternatives considered |
|---|---|---|---|
| Client framework | React + Vite + TypeScript + Tailwind + React Router + TanStack Query | Specified by owner; Vite gives fast local iteration, TanStack Query gives cache/retry/loading-state handling for free (needed for autosave and offline-tolerant saves per FR-008a) | Next.js (rejected: SSR/routing complexity not needed for an internal tool; adds a server runtime beyond the single `app` container the Simplicity principle calls for) |
| Server framework | Express + TypeScript | Specified by owner; minimal, well-understood, easy to layer per Principle IX | Fastify/NestJS (rejected: NestJS's DI/module ceremony conflicts with "no abstraction without a second use"; Fastify offers no benefit at this scale) |
| ORM/DB | Prisma + PostgreSQL | Specified by owner; Prisma's generated types feed directly into the repository layer, migrations are declarative and reproducible via `prisma migrate deploy` on container start | Raw SQL/knex (rejected: more boilerplate for the same guarantees at this scale) |
| Validation | Zod, single source in `shared/` | Specified by owner; one schema drives both client-side form validation and server-side request validation, per Principle IX's "contract lives in one shared location" | Joi/Yup (rejected: no first-class TypeScript type inference as clean as Zod's `z.infer`) |
| Sessions | `express-session` + `connect-pg-simple` store | Specified by owner (Postgres-backed sessions); reuses the one Postgres instance already required (Simplicity principle — no Redis), and survives an app-container restart without logging everyone out | JWT in a cookie (rejected: revocation on deactivate (FR-031a) is immediate with server-side sessions — a JWT would keep working until it expires) |
| Passwords | bcrypt, cost factor 12 | Specified by owner; cost 12 is the current OWASP-recommended minimum and cheap enough on modest hardware for ~300 users | argon2 (reasonable alternative; not chosen only because it's not in the specified stack and bcrypt is already a proven, simple fit) |
| Import parsing | `exceljs` (XLSX), `csv-parse` (CSV) | Specified by owner; both handle Arabic text natively once decoded correctly | `xlsx`/SheetJS (rejected: exceljs has clearer streaming/row APIs for the per-row preview flow) |
| Testing | Vitest + Supertest against a **real** Postgres (not mocked) | Specified by owner; matches constitution Principle II/VI — a mocked DB would hide exactly the unique-constraint and transaction-timing bugs those principles exist to catch | In-memory SQLite substitute (rejected outright — Prisma's `Decimal`/timestamp/constraint behavior differs from Postgres enough that a passing SQLite test would not prove the real thing) |
| Fonts | Noto Sans Arabic + Noto Sans, self-hosted via `@fontsource` | Specified by owner and required by FR-037 | Google Fonts CDN (rejected: external network dependency, ruled out by FR-037) |

## Implementation-level decisions (this phase)

**Decision**: "DB is empty" (the seed trigger on container start) is determined by `SELECT count(*) FROM "User"` — seed runs only if zero.
**Rationale**: Simple, idempotent-safe check; avoids re-seeding (and duplicating) data on every container restart.
**Alternatives considered**: A dedicated `seed_applied` flag table — rejected as an unneeded extra table for a check the `User` count already answers.

**Decision**: CSV encoding is validated by attempting a strict UTF-8 decode (rejecting on any invalid byte sequence) and stripping a UTF-8 BOM if present, before parsing rows; any decode failure returns the FR-019a error message without invoking `csv-parse`.
**Rationale**: A strict decode is exactly the boundary FR-019a needs (accept UTF-8 with/without BOM, reject everything else, including Windows-1256) without needing an encoding-*detection* library, which would be guessing rather than asking the admin to fix the file.
**Alternatives considered**: `chardet`-style encoding sniffing to auto-detect and transcode Windows-1256 — this is exactly the "next week" item DECISIONS.md defers; building it now would silently expand scope back to something already deliberately cut.

**Decision**: Arabic name normalization (FR-038) is a pure function in `shared/` (`normalizeArabicName`) applied at write time to populate a stored `name_normalized` column, and applied to the search query at read time. It: strips Arabic diacritics (Unicode combining marks in the Arabic block, U+064B–U+0652 etc.), maps `أ`/`إ`/`آ` to bare `ا`, maps trailing `ة` to `ه` for matching purposes, and lowercases/trims Latin characters for mixed names.
**Rationale**: A stored, indexed normalized column makes search a plain equality/`LIKE` query — fast and simple — versus normalizing every row at query time. Putting the function in `shared/` means the exact same normalization used to populate the column is available to the client if client-side filtering is ever added, with one definition (Principle IX).
**Alternatives considered**: Postgres `unaccent` extension — rejected because it's Latin-diacritic-focused and doesn't handle Arabic alef/teh-marbuta unification out of the box; would still need a custom function layered on top, so it doesn't remove the custom-code need, only adds an extension dependency.

**Decision**: i18n is two typed dictionaries (`shared/src/i18n/en.ts`, `ar.ts`) exporting a `const` object each, with `ar` typed as `Record<keyof typeof en, string>` so TypeScript itself fails the build if a key is missing in either file; a Vitest test (`i18n.spec.ts`) additionally asserts `Object.keys(en)` and the (recursively flattened) keys of `ar` are set-equal, as a runtime backstop independent of the type check.
**Rationale**: Matches the "no heavy i18n library" instruction exactly; the type-level check catches most mistakes at compile time, the test catches anything TypeScript's structural typing might miss (e.g., an extra key in `ar` not in `en`, which the `Record<keyof typeof en, ...>` type alone wouldn't flag).
**Alternatives considered**: i18next/react-intl — explicitly rejected by the owner's instruction ("no heavy i18n library").

**Decision**: The system clock is injected into every service function that needs "now" via a `Clock` interface (`{ now(): Date }`) with a `SystemClock` implementation used in production and a `FixedClock`/`AdvanceableClock` test double in tests — never `new Date()` called directly inside a service.
**Rationale**: This is what makes FR-008/FR-009's deadline and grace-period logic (and the constitution's Principle VI test-first rule) testable without real timers or `sleep()` in tests.
**Alternatives considered**: Vitest's fake timers (`vi.useFakeTimers()`) alone — still usable for a few cases, but an injected `Clock` is preferred as the primary mechanism because it also works cleanly across the HTTP boundary in Supertest integration tests, where faking global timers is less reliable.

**Decision**: A `Quiz`'s "locked" state (FR-024) is derived at request time (`EXISTS (SELECT 1 FROM "Attempt" WHERE quiz_id = ...)`), not stored as a column.
**Rationale**: A stored flag could drift from reality if an attempt is ever deleted (it never is, but "never say never" — derived state cannot drift, full stop) and this is exactly the "no abstraction without a need" spirit of Principle IX: a boolean column is not needed when a cheap indexed existence check answers the same question correctly, always.
**Alternatives considered**: A stored `locked_at` timestamp set by a trigger — more moving parts for no behavioral gain at this scale.

**Decision**: Publishing a quiz (`DRAFT` → `PUBLISHED`) is one-directional in this version; there is no "unpublish" action, even for a draft-turned-published quiz with zero attempts.
**Rationale**: Not asked for in the brief or this planning session; adding it would be scope the owner didn't request. If needed later, a teacher can leave dates in the future so nothing is actually visible to students yet, which covers the "I published too early" case well enough for v1.
**Alternatives considered**: Allow unpublish while attempt count is zero — plausible, but deliberately deferred; flag for `DECISIONS.md`'s "Next week" section when this feature is implemented.

**Decision**: Import preview is **not** persisted row-by-row; it is computed in memory from the uploaded file and returned to the client for review. Only on explicit confirm are the resulting `User`/`Class`/`Quiz`/`Question` rows created, alongside one `ImportBatch` audit row summarizing counts (total/created/skipped-duplicate/failed).
**Rationale**: Matches Principle IX's "no abstraction without a need" — a full row-level staging table would duplicate the file's own content in the database for a preview step that only needs to exist for the duration of one HTTP round trip.
**Alternatives considered**: Persist every previewed row (accepted or not) for audit purposes — rejected as unrequested scope; the summary `ImportBatch` row is enough of an audit trail for a first version.

## Lint/tooling enforcement of Principle IX's size limits

**Decision**: ESLint enforces `max-lines: ["warn", 200]` project-wide and `max-lines-per-function: ["warn", 40]`; `@typescript-eslint/no-explicit-any: "error"`; `@typescript-eslint/no-non-null-assertion: "warn"` (suppressing it requires an inline `eslint-disable-next-line` comment, which structurally forces the "no non-null assertion without a comment" rule from CLAUDE.md — the comment needed to silence the linter *is* the required justification). The 150-line React-component guideline is enforced the same way `max-lines` is (applies to `.tsx` files too) plus PR-level review, since ESLint has no separate "component vs. any other file" size rule.
**Rationale**: Turns a written convention into something `npm run lint` actually checks before every commit, per CLAUDE.md's "ESLint + Prettier configured; `npm run lint` must pass before every commit."
**Alternatives considered**: Convention-only (no lint rule) — rejected; an unenforced soft limit tends to drift silently, which is exactly what Principle IX exists to prevent.

## Outstanding NEEDS CLARIFICATION

None. Every Technical Context field in `plan.md` is fully specified.
