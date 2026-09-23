<!--
Sync Impact Report
==================
Version: (initial) → 1.0.0
Rationale: Initial ratification. The project owner supplied a complete set of 8
core principles directly; this is the first committed version of the
constitution, so it is the MAJOR 1.0.0 baseline rather than an amendment.

Principles adopted:
- I. Server Is the Single Source of Truth for Time, Attempts & Scoring
- II. Correctness Under Bad Behaviour
- III. Least Privilege on Every Endpoint
- IV. Mobile-First
- V. Arabic Is First-Class
- VI. Tests First for Scoring, Timing & Attempt Rules
- VII. Simplicity
- VIII. Every Assumption Is Written Down

Added sections: Delivery & Documentation Constraints; Workflow & Commit
Discipline; Governance.

Removed sections: none (initial adoption).

Templates requiring updates:
- ✅ .specify/templates/plan-template.md — Constitution Check gate reads
  generically from this file; no hardcoded principle references to fix.
- ✅ .specify/templates/spec-template.md — no constitution-specific references;
  reviewed, no changes needed.
- ✅ .specify/templates/tasks-template.md — no constitution-specific references;
  reviewed, no changes needed.
- ✅ CLAUDE.md — synced to carry the same non-negotiable rules (including
  "correctness under bad behaviour" test scenarios and "no feature without a
  reason in DECISIONS.md").
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

**Version**: 1.0.0 | **Ratified**: 2026-09-23 | **Last Amended**: 2026-09-23
