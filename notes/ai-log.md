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

