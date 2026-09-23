# AI Log

Running log of AI-assisted work on this project, one entry per phase. See CLAUDE.md for the required entry format.

## Phase: Project setup (constitution, brief, initial spec) — 2026-09-23

**What I asked for**: Set up CLAUDE.md and docs/brief.md, run auto-mode setup, then run `/speckit-constitution` to establish project governance, then `/speckit-specify` to write the first feature spec for the quiz app described in docs/brief.md (clickable MVP, spreadsheet import in scope, users = admin/teacher/student, classes 10A/10B/11A).

**What you produced**:
- CLAUDE.md with stack, non-negotiable rules, workflow and documentation duties; docs/brief.md (client brief, verbatim).
- `/speckit-constitution` was first run with no input: I derived a 6-principle constitution from CLAUDE.md's existing non-negotiable rules (server-authoritative scoring, no answer leakage, DB-enforced attempt uniqueness, role+ownership checks, validated input/locale handling, mobile-first/test-first).
- You then re-ran `/speckit-constitution` supplying your own 8 principles verbatim (server as source of truth, correctness under bad behaviour, least privilege, mobile-first, Arabic-first, tests-first, simplicity, assumptions written down). I replaced the derived 6-principle draft with your 8, folding in the specifics that were only in the first draft (e.g. `is_correct` non-disclosure, DB unique constraint, Decimal scores, dir="auto") as supporting detail under the matching new principles, and synced CLAUDE.md to match.
- Constitution version was set to 1.0.0 (not 2.0.0) once you pointed out the first draft was never committed, so the 8-principle version is the true initial ratification; simplified the Sync Impact Report accordingly.
- `/speckit-specify` produced `specs/001-quiz-app-core/spec.md`: 4 prioritized user stories, 23+ functional requirements, 6 key entities, 7 success criteria, and an assumptions list.

**What went wrong or needed correction**:
- I initially left two scoring/auth ambiguities (negative-marking formula; login credentials for spreadsheet-imported users with no email) as assumptions with a made-up default, then judged they were significant enough to flag as `[NEEDS CLARIFICATION]` and asked instead of guessing — you gave detailed answers (fraction-of-points penalty defaulting to 0.25, floored at 0; username-based login with admin-generated printable passwords, no self-service reset in v1) which I then had to thread through FR-012/FR-012a/FR-012b, FR-001/FR-001a/FR-001b, the matching acceptance scenario, an edge case, and the Assumptions section — several places needed updating for one decision, not just the requirement itself.
- The constitution work took two passes: my first, unprompted draft of principles/wording did not match what you actually wanted, so it was fully replaced rather than merged.

**How it was verified**: Read back CLAUDE.md and constitution.md after edits to confirm no leftover placeholder tokens or contradictions (e.g. removed the "score can go negative" edge case once floor-at-zero was decided). Grepped spec.md for `NEEDS CLARIFICATION` to confirm both markers were resolved before marking the requirements checklist complete. No automated tests exist yet at this stage (no application code has been written).

**My notes:**


## Phase: Spec clarification (`/speckit-clarify`) — 2026-09-23

**What I asked for**: Run `/speckit-clarify` against `specs/001-quiz-app-core/spec.md`, supplying 13 decisions up front (login/username scheme, class-scoped quizzes, deadline formula with grace period, autosave/resume, negative-marking mechanics, answer-key visibility timing, quiz field locking after first attempt, roles, UTC/Amman display, English UI with Arabic content support, XLSX/CSV import with encoding handling, results detail, and an explicit out-of-scope list) and telling you to only ask about anything not already covered. Then create DECISIONS.md, log this phase, and commit.

**What you produced**:
- Folded all 13 supplied decisions directly into `spec.md`: added a `## Clarifications` section, rewrote/extended FR-004 through FR-027 (new FRs for class-scoping, deadline/grace period, autosave, answer-key timing, draft/publish lifecycle, field-locking after first attempt, Amman display, results detail, import format/encoding/preview), updated Key Entities (Quiz gained assigned classes + draft/published status; Attempt gained deadline/autosave; Import Batch gained preview/format detail), added a dedicated `## Out of Scope` section, and updated the edge cases and acceptance scenarios that touched the same behavior so nothing was left contradicting the new decisions.
- Identified 2 real gaps not covered by your list and asked before guessing: (1) who owns a quiz imported via spreadsheet and how classes get assigned to it, (2) how a student's login ID is generated during import. You answered both; I threaded the answers into FR-016/FR-018/FR-020 and the User Story 3 scenarios.
- Re-validated `checklists/requirements.md` against the updated spec — all items still pass — and appended a note describing what changed in this session.
- Created `DECISIONS.md` with all four required sections, populated from the full assumption/scope history so far (not just this session), each with a one-line why.

**What went wrong or needed correction**: Nothing required correction from you this phase. One internal correction: while re-reading your "only dates can still change" instruction, I initially considered asking whether *other* quiz fields (time limit, negative marking, assigned classes) should also lock once an attempt exists — then realized the literal wording already answers that (only dates stay editable, everything else locks), so I resolved it directly as FR-024 instead of spending one of the question slots on something already decided.

**How it was verified**: Grepped the updated `spec.md` for `NEEDS CLARIFICATION` (none remain). Manually re-read every touched section (User Stories 1–4, Edge Cases, Functional Requirements, Key Entities, Success Criteria, Assumptions) to check the new decisions didn't contradict earlier text — e.g., removed the old "answer review deferred to a future iteration" assumption once the close-date-gated reveal was decided, and confirmed the requirements checklist's pass/fail states were re-checked, not just left as-is. No application code or automated tests exist yet at this stage.

**My notes:**


## Phase: Scope review before UI design — 2026-09-23

**What I asked for**: A pre-UI scope review combining a second AI's review of the spec with my own decisions on two open questions it raised — I chose to keep full admin class/user management in scope (rather than defer it) and to make the UI itself fully bilingual from the start (rather than English-only with Arabic content support). I gave 8 groups of decisions covering admin capabilities, import encoding limits, grace-period semantics, autosave rationale, negative-marking UI copy, and the Arabic/RTL requirements, then asked for a "Priorities" section in DECISIONS.md and a full brief-to-requirement traceability matrix.

**What you produced**:
- Added User Story 5 (admin manages classes and users) and 8 new/extended FR groups to `spec.md`: class create/rename/archive/delete rules (FR-028/029), student class moves preserving history (FR-030), direct user creation and deactivation (FR-031/031a), the printable-credentials-is-the-import-table decision (FR-031b), admin's unfiltered view (FR-031c), seeded classes (FR-031d), the negative-marking intro copy (FR-032), and six FRs for full bilingual UI — language toggle, RTL + logical CSS, content dir=auto, self-hosted font, diacritic-insensitive search (FR-033–FR-038).
- Tightened import-encoding scope: reversed the earlier decision to accept Windows-1256 CSV directly (FR-019a now only accepts XLSX and UTF-8 CSV, rejecting anything else with a specific error message), moving Windows-1256 support to "next week" — this contradicted what the previous `/speckit-clarify` session had recorded, so I had to update that earlier language in three places (an acceptance scenario, an FR, and an assumption) rather than just adding new text.
- Reversed the "English UI, Arabic content only" assumption from the previous phase into a full bilingual-UI requirement, and removed the now-stale "Arabic UI translation deferred to next week" line from both `spec.md`'s Out of Scope and `DECISIONS.md`'s Next Week section, since it's in scope now.
- Clarified the grace-period semantics precisely per your wording: the client-side countdown stops at the deadline (never visually extends), the server accepts a save/submit up to 10s late for network latency only, and the grace window never lets a student start a new attempt after `closes_at` — added as explicit acceptance scenarios and edge cases, not just an FR tweak, since this is exactly the kind of timing rule the constitution requires tests for.
- Updated `DECISIONS.md`: added a new "Priorities" section (your exact 10-item ordering), added assumptions/built-items for everything above, and corrected the two reversed decisions (Windows-1256, English-only UI) in place rather than leaving the old reasoning to contradict the new entries.
- Created `specs/001-quiz-app-core/traceability.md`: every sentence in the brief's "The brief" section and every "What to deliver" item mapped to FR ID(s), the screen(s) that satisfy it, and planned automated test names; a separate table for the two operational additions (admin tooling, grace-period precision) that weren't literal brief sentences; and a gap check confirming no brief requirement was left without a corresponding FR.

**What went wrong or needed correction**: Nothing needed correction from you this phase — this was a one-shot batch of already-made decisions rather than a Q&A loop, so there was no back-and-forth to get wrong. My own catch: two of your decisions directly reversed spec content from the previous `/speckit-clarify` phase (Windows-1256 support, English-only UI); I had to find and edit every place the old decision had been threaded through (FR text, an acceptance scenario, an assumption, and DECISIONS.md's Built/Next-week sections) rather than just appending the new decision alongside the stale one.

**How it was verified**: Grepped `spec.md` for "Windows-1256", "translat", and "English for this version" after editing to confirm no contradictory leftover text remained. Re-read the full updated spec end to end to check the new User Story 5 and Arabic FRs didn't conflict with existing role/ownership/locking rules. Re-validated the requirements checklist (still all passing) and appended a note on what changed. Built the traceability table by re-reading `docs/brief.md` sentence by sentence against the final FR list rather than working from memory, to catch any requirement the spec didn't actually cover. No application code or automated tests exist yet at this stage — the test names in `traceability.md` are a plan, not yet-passing tests.

**My notes:**

