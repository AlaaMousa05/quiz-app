# AI Usage

This document summarizes how AI (Claude, via Claude Code) was used to build this project. It is written from `notes/ai-log.md`, which has one detailed entry per phase — this is the factual summary; the log has the full detail, including every judgment call and every fix.

## How the project was built

The entire project — from the initial spec through the final admin screens — was built through a sequence of Claude Code sessions using the `speckit` workflow: constitution → spec → clarify → scope review → UI/design system → implementation plan → task breakdown → phase-by-phase implementation. Every phase followed CLAUDE.md's rules: tests written before scoring/timing/attempt/auth/import logic, a quality gate (lint, tests, `/simplify`, `/code-review` where applicable) at the end of each phase, and documentation (README, DECISIONS.md, ai-log.md) updated in the same commit as the code.

## What AI produced vs. what the user decided

The user made every scope and requirements decision: the client brief, the constitution's principles, every clarification (login scheme, deadline/grace-period rules, negative-marking mechanics, admin capabilities, bilingual UI scope, and more — recorded in `DECISIONS.md`), and the architecture (stack, folder structure, data model, an 11-phase build order). AI's job was to turn those decisions into a working, tested application, flag genuine ambiguities before guessing, and self-review before every commit.

Two decisions were flagged and escalated rather than guessed, both in the very first phase (negative-marking formula, and login credentials for spreadsheet-imported users with no email) — the user answered both directly. No further "WAITING FOR YOU" escalations were needed in any later phase; every subsequent requirement was either already specified or a judgment call small enough to record in DECISIONS.md rather than block on.

## Real bugs found (and by what process)

These are the genuine bugs caught during development, not hypothetical risks — each is detailed further in `notes/ai-log.md`'s matching phase entry:

- **Session-fixation vulnerability** (Phase 2, `/code-review`): login didn't rotate the session ID, so an attacker-supplied session ID from before login would become valid once the victim logged in. Fixed with `req.session.regenerate()`.
- **Login timing side-channel** (Phase 2, `/code-review`): `bcrypt.compare` only ran for existing usernames, making "wrong password" and "unknown username" distinguishable by response time. Fixed by always comparing against a dummy hash.
- **Secure-cookie-over-HTTP bug** (Phase 2, manual `curl` testing against the real Docker container — not caught by the in-process Supertest suite): the session cookie was marked `Secure` while the app served plain HTTP, so login "succeeded" but no session was ever actually stored by the browser. Fixed by making `secure: false` unconditional, with the reasoning recorded in DECISIONS.md.
- **Logout didn't clear the cookie** (Phase 2, `/code-review`): `session.destroy()` only clears server-side state; added `res.clearCookie(...)`.
- **Missing error boundary** (Phase 2, `/code-review`): an uncaught non-401 query error produced a blank white screen; added a minimal `ErrorBoundary`.
- **Answer-review contract gap** (Phase 5, discovered while building the UI): the review endpoint returned bare option ids with no text, so the Review screen couldn't actually render "Your answer: B. 4". Fixed by extending the endpoint and the contract doc together.
- **Post-close review endpoint leaking a `409` instead of `403`** (Phase 4, `/code-review`'s line-by-line angle): during an attempt's own grace window just after a quiz closed, the review endpoint could throw an internal `409` state instead of the documented `403`, in a way that could reveal the answer key a few seconds early to a fast reviewer while classmates were still finishing. Fixed with an explicit grace check and two regression tests.
- **A systemic Express routing bug** (Phase 6, caught immediately by the new integration test suite): a router-level `requireRole("STUDENT")` guard, written in Phase 4, silently intercepted *every* request under the shared `/api` prefix — including the brand-new `/api/teacher/*` and `/api/imports/*` routes added in Phase 6 — before Express ever tried matching them elsewhere. This had been a latent bug since Phase 4; it only became visible once a second router shared the same mount prefix. Fixed by converting the router-level guard to per-route middleware.
- **A silent response-shape bug** (Phase 6, caught by manual `curl` smoke-testing against the rebuilt Docker image, not by any automated test): `addQuestion`/`editQuestion` returned the raw Prisma row, serializing `points` as a string instead of a number and leaking internal DB fields. TypeScript didn't catch it because the controller's declared return type didn't match the runtime shape. Fixed with an explicit response mapper.

## What was not done, and why

This project's final two phases (10 and 11) were compressed under an explicit time-crunch instruction partway through the last session. Being honest about exactly what that cut, since it's the most load-bearing thing to know before treating this as finished:

- **No dedicated adversarial/break-it test pass was run.** The original plan (Phase 10) called for deliberately attacking double-submit races, forged scores, clock tampering, and permission bypasses with new tests. That pass was skipped; the scenarios it would have covered are exercised only by whatever the existing Phase 4/6/7 test suites already happen to cover (which is substantial — see below — but was not purpose-built as an adversarial pass).
- **No `/code-review` or `/security-review` was run** for Phases 6 through 11, at any effort level. Phases 1–5 (scaffold, auth, scoring, attempts, student UI) did get `/code-review` at medium effort as originally planned, and those findings are the bugs listed above. From Phase 6 onward, the standing instruction for the session first deferred all review to a single project-end pass, and then — under the final time-crunch instruction — cancelled that pass entirely. This means the admin/import/credential-creation code (Phase 8) in particular has had only manual testing and automated test coverage, not a structured adversarial review.
- **The seed dataset was trimmed**: 24 students (8 per class) instead of the originally planned ~60, one question per quiz instead of a fuller bank, and no separate `sample-data/` spreadsheet files — everything is inline in `server/prisma/seed.ts`. This still exercises every role and every feature end to end; it's smaller than planned, not narrower in coverage.
- **`/simplify` was not run for Phases 6 through 9** — some duplication a cleanup pass would likely have caught (noted in DECISIONS.md) was left as-is.
- **No headless-browser click-through was run in any phase** (no browser-automation tool was available in this environment). Every phase was instead verified with: the automated test suite (Vitest/Supertest against a real Postgres database — 126 tests passing at the time of the last commit), TypeScript builds (`tsc -b`), production builds (`vite build`), and manual `curl` smoke-testing against the actual running `docker compose` container (not just the in-process test harness) for every new endpoint each phase added.

See `DECISIONS.md`'s "What's unfinished" section for the same list with more detail, and `notes/ai-log.md` for the full phase-by-phase record this document was built from.
