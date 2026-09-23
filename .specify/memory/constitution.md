<!--
Sync Impact Report
==================
Version change: 1.0.0 → 1.1.0
Rationale: Added a new core principle (IX. Clean, Layered, Small Units) covering
code structure and quality — a new principle with no redefinition or removal of
existing ones, so this is a MINOR bump per the versioning policy below.

Modified principles: none (all eight existing principles unchanged).

Added principles:
- IX. Clean, Layered, Small Units

Added sections: none new at the top level (Principle IX lives under Core
Principles alongside the existing eight).

Removed sections: none.

Templates requiring updates:
- ✅ .specify/templates/plan-template.md — Constitution Check gate reads
  generically from this file; no hardcoded principle references to fix.
- ✅ .specify/templates/spec-template.md — no constitution-specific references;
  reviewed, no changes needed.
- ✅ .specify/templates/tasks-template.md — no constitution-specific references;
  reviewed, no changes needed.
- ✅ CLAUDE.md — added a new "Code structure and quality" section carrying the
  same layering/size/tooling rules that back this principle.
- ✅ docs/brief.md — source material, unchanged (client brief, not governance).

Follow-up TODOs: none.
-->

# Quiz App - Nour's Tutoring Centre Constitution

## Core Principles

### I. Server Is the Single Source of Truth for Time, Attempts & Scoring
The server MUST be the sole authority for elapsed time, quiz open/close windows,
attempt state, and score computation. The client is never trusted: client-submitted
timestamps, durations, attempt status, or scores MUST NOT be used in any
calculation. Scores MUST use exact decimal arithmetic (e.g., a `Decimal` type),
never JavaScript floating-point numbers.

Rationale: Grades determine real outcomes for students; any client-controlled
input to timing, attempts, or scoring is trivially forgeable and would undermine
the fairness the whole assessment depends on.

### II. Correctness Under Bad Behaviour
The system MUST remain correct when users behave badly or the network misbehaves.
At minimum, the following MUST be explicitly handled and covered by automated
tests: double submits, page refreshes mid-attempt, the same quiz open in two
tabs, submissions arriving after the quiz window has closed, and tampered
requests (forged fields, replayed payloads, out-of-order calls). "One attempt per
student per quiz" MUST be enforced by a database-level unique constraint, not
solely by application logic. The system MUST NOT transmit `is_correct`,
correct-answer keys, or any signal from which correctness can be derived, to a
student before that student's attempt has been submitted and finalized.

Rationale: Real students on real phones double-tap, lose connection, and reopen
tabs; a quiz platform that only works on the happy path will silently corrupt
grades, which is the one thing this system cannot get wrong.

### III. Least Privilege on Every Endpoint
Every endpoint MUST check both the caller's role AND their ownership of the
resource being accessed (a student may only access their own class's/attempt's
data; a teacher may only access their own quizzes and their own students'
results). A role check alone, without an ownership check, MUST NOT be treated as
sufficient authorization.

Rationale: Role-only checks still allow, for example, one teacher to read
another teacher's quiz bank, or one student to see another student's results —
a real privacy and integrity failure for a school system.

### IV. Mobile-First
Every screen MUST be designed for a 375px-wide phone first, with tap targets of
at least 44px, before any larger breakpoint is considered.

Rationale: Most students only have a phone, per the client brief; designing
mobile-first (not mobile-adapted-after-the-fact) is the only way to guarantee
the primary device works well.

### V. Arabic Is First-Class
Arabic MUST be treated as a first-class language throughout the system: UTF-8
encoding everywhere, layouts that are RTL-safe (not just LTR layouts that
happen to render Arabic glyphs), and `dir="auto"` on every user-facing text
element that may contain Arabic content.

Rationale: Many students have Arabic names and some quizzes are in Arabic, per
the client brief; retrofitting RTL support after the fact tends to break
layouts that were only ever tested left-to-right.

### VI. Tests First for Scoring, Timing & Attempt Rules
Any change to scoring, timing, or attempt logic MUST have tests written before
the change is made, and those tests MUST pass before the change is committed.

Rationale: This is the highest-risk logic in the system (see Principle I and
II); test-first here catches regressions before they reach a student's grade,
not after.

### VII. Simplicity
The system MUST run on one Postgres database and one application container
unless a documented need requires otherwise. No feature MAY be added without a
reason recorded in DECISIONS.md.

Rationale: This is a small tutoring centre's quiz tool, not a platform;
unjustified infrastructure or scope creep costs more to run and maintain than
it returns, and every addition should be a deliberate, recorded choice.

### VIII. Every Assumption Is Written Down
Every assumption made during development — about requirements, data shape, user
behaviour, or scope — MUST be written down in DECISIONS.md under the correct
section (Assumptions / Built but not asked for / Deliberately left out / Next
week) with a one-line rationale, at the time it is made.

Rationale: The client brief has gaps by design; undocumented assumptions are
invisible to reviewers and to the client, and cannot be revisited or corrected
later if no one recorded that they were made.

### IX. Clean, Layered, Small Units
Code MUST be organized into small, single-responsibility units and MUST NOT be
over-engineered: apply SOLID pragmatically (single responsibility per file or
function; dependency injection only where it enables testing — e.g., an
injected clock or repository — never as decoration), and introduce no
abstraction (interface, factory, or pattern) without a second concrete use or a
testing need. Soft size limits apply — roughly 200 lines per file, 150 lines
per React component, 40 lines per function — and a unit exceeding them MUST be
split by responsibility. The backend MUST be layered (routes → controllers →
services → repositories, with errors and configuration as their own concerns)
so that business logic never touches HTTP objects and never talks to the
database directly; the frontend MUST separate data-fetching, logic/state, and
presentation so that a component with no fetching or business logic stays
presentational. The single, dual-used definition of every request/response
contract (schema plus type) MUST live in one shared location so client and
server cannot silently drift apart, and the client and server MUST NOT import
from each other directly. Tests MUST mirror this structure — services
unit-tested, HTTP routes integration-tested, and any hook or module with real
logic (e.g., a timer or autosave) tested on its own.

Rationale: A first-clickable-version timeline invites shortcuts that calcify
into permanent structure; naming the layering and size limits now — before
code exists — is cheaper than untangling a monolith later, and keeps the
codebase reviewable by someone other than the AI that wrote it.

## Delivery & Documentation Constraints

- Stack: React + Vite + TypeScript + Tailwind (`client/`); Express + TypeScript +
  Prisma + PostgreSQL + Zod (`server/`); Vitest + Supertest for tests; Docker
  Compose for local orchestration.
- Every request body MUST be validated with Zod (or an equivalent schema
  validator) before use. All timestamps MUST be stored in UTC and converted to
  Asia/Amman only at display time.
- The project MUST run from a clean checkout with a single command
  (`docker compose up --build`). README.md MUST stay exactly accurate for run
  commands, seed instructions, and demo logins — any change to ports, env vars,
  scripts, or seed users MUST update README.md in the same commit.
- `docs/brief.md` is the source of truth for product requirements and MUST be
  re-read before planning any phase.
- `notes/ai-log.md` MUST receive one entry per phase (what was asked, what was
  produced, what went wrong or needed correction, how it was verified, and an
  empty "My notes:" line left for the human — never invent their opinions).
  `AI_USAGE.md` is written only in the final phase, built from that log, and MUST
  be strictly factual — never claim a check that did not happen.

## Workflow & Commit Discipline

- Commits MUST be small and use Conventional Commit prefixes (`feat:`, `fix:`,
  `test:`, `docs:`, `chore:`).
- Tests MUST be run before every commit.
- Nothing MUST be pushed to any remote without explicit approval from the project
  owner.

## Governance

This constitution supersedes ad hoc practices. `docs/brief.md` defines *what* to
build; this constitution defines *how* the team builds it — where the two could
be read as conflicting on process (not requirements), this constitution governs.

Amendments MUST update the version number using semantic versioning: MAJOR for
backward-incompatible principle removals or redefinitions, MINOR for a new
principle or materially expanded guidance, PATCH for clarifications and wording
fixes. Every amendment MUST be recorded in a Sync Impact Report comment at the
top of this file and MUST be propagated to CLAUDE.md and any dependent templates
in the same change.

All plans and pull requests MUST verify compliance with the Core Principles via
the Constitution Check gate in the plan template. Any violation MUST either be
justified in the plan's Complexity Tracking table or resolved by amending the
principle first — silent exceptions are not permitted.

CLAUDE.md carries day-to-day runtime agent guidance derived from this
constitution; where the two conflict, this constitution is authoritative and
CLAUDE.md MUST be updated to match.

**Version**: 1.1.0 | **Ratified**: 2026-09-23 | **Last Amended**: 2026-09-23
