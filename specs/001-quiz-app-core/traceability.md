# Traceability: docs/brief.md → spec.md

Maps every requirement-bearing sentence in `docs/brief.md` (plus each numbered "What to deliver" item) to the functional requirement(s) it drives in `spec.md`, the screen(s) that satisfy it, and the automated test(s) planned to prove it. Test names are planned now, before implementation, per the constitution's test-first rule; they will be created under `server/tests/` or `client/tests/` as each area is built.

Screen IDs (`S`=Student, `T`=Teacher, `A`=Admin) refer to the full screen inventory in [ui.md](./ui.md): S1 Login, S2 My Quizzes, S3 Quiz Intro, S4 Taking Quiz, S5 Submit Confirmation, S6 Result, S7 Review; T1 My Quizzes, T2 Create/Edit Quiz Settings, T3 Questions Editor, T4 Import Quiz from Spreadsheet, T5 Quiz Results; A1 Dashboard, A2 Classes, A3 Class Detail, A4 Users, A5 Import Users, A6 All Quizzes, A7 All Results.

Legend: **N/A** = not a functional requirement of the app itself (process, motivation, or a repo-level deliverable); reasoning is given in Notes.

## "The brief" (Nour's narrative)

| Brief excerpt | FR ID(s) | Screen(s) | Planned automated test(s) | Notes |
|---|---|---|---|---|
| "I run a small tutoring centre in Amman with about 300 students and 12 teachers." | N/A | Seed data / A5 | N/A | Scale context only; seed data uses a realistic subset (3 classes, ~20 students each, 4 teachers) per DECISIONS.md, not the full 300/12. The app itself has no hard cap that would prevent scaling up. |
| "We run our weekly quizzes on paper and it is killing us." | N/A | — | — | Motivation only, not a requirement. |
| "I want a simple website where students log in" | FR-001, FR-001a | S1 | `auth.spec: student can log in with username + password`, `auth.spec: invalid credentials are rejected` | — |
| "...take a timed multiple choice quiz" | FR-004, FR-005, FR-008, FR-008a, FR-009 | S4 | `attempt.spec: countdown enforces server-recorded deadline`, `attempt.spec: auto-finalizes at deadline with recorded answers`, `attempt.spec: answers autosave and resume with correct remaining time` | — |
| "...and see their score at the end." | FR-010, FR-013 | S6 | `scoring.spec: score shown immediately after submit`, `scoring.spec: correctness never revealed before submission` | — |
| "Our teachers will put the quizzes in." | FR-004, FR-005 | T2, T3 | `quiz-builder.spec: teacher can create a quiz with questions, options, and points` | — |
| "Each quiz has a time limit (usually 20 minutes)" | FR-004 (default), FR-008 | T2, S3, S4 | `quiz-builder.spec: time limit defaults to 20 minutes if unset` | — |
| "...and a date range when it is open." | FR-004, FR-006 | T2, S2 | `access.spec: quiz not startable outside its open date range`, `access.spec: quiz hidden until published` | — |
| "Students should not be able to take a quiz twice." | FR-007 | S4, S2 | `attempt.spec: second attempt blocked after submission`, `attempt.spec: duplicate attempt blocked under concurrent/double-submit/two-tab requests` | Backed by a DB-level unique constraint per the constitution, not app logic alone. |
| "I also want to see how the students did." | FR-014, FR-015, FR-026, FR-027, FR-031c | T5, A6, A7 | `results.spec: teacher sees results for own quiz`, `results.spec: admin sees results for any quiz`, `results.spec: CSV export matches on-screen data` | — |
| "...some of our teachers give negative marks for wrong answers and some do not. It depends on the teacher and the quiz." | FR-012, FR-012a, FR-012b, FR-032 | T2, S3 | `scoring.spec: negative-marking penalty applies configured fraction of question points`, `scoring.spec: total score floors at zero`, `scoring.spec: new quiz inherits teacher's default marking setting` | — |
| "I will send you our real student list, teacher list and last week's quiz as spreadsheets once you have something to show me. For now, please make up some data that looks like ours... loadable." | FR-016, FR-017, FR-018, FR-019, FR-019a, FR-020, FR-020a | A5, T4 | `import.spec: valid rows create accounts/quiz content`, `import.spec: preview shows per-row errors before saving`, `seed.spec: seed script produces realistic sample data matching the brief` | — |
| "We have three classes at the moment, 10A, 10B and 11A, with around 20 students in each." | FR-031d, FR-020a | Seed data, A2 | `seed.spec: seed data contains 10A/10B/11A with ~20 students each` | — |
| "Four of our teachers would be using this to start with." | N/A (seed data) | Seed data | `seed.spec: seed data contains 4 teacher accounts` | Not a distinct FR — a seed-data fact, tested at the seed-script level. |
| "A typical quiz has 15 questions with four options each, and each question has its own number of points." | FR-005 | T3, seed quiz | `quiz-builder.spec: question requires exactly 4 options, 1 correct answer, and a point value`, `seed.spec: seed quiz has 15 questions` | — |
| "Many of our students have Arabic names and some of our quizzes are in Arabic, so please make sure that works." | FR-022, FR-033–FR-038 | All screens (names), S4 (Arabic content), header on every screen (language toggle) | `i18n.spec: Arabic names render correctly with dir=auto`, `i18n.spec: Arabic quiz content displays RTL correctly`, `i18n.spec: full UI renders correctly in Arabic with dir=rtl and logical properties`, `search.spec: Arabic name search ignores diacritics and normalizes alef variants` | Full bilingual UI (not just content) is a scope decision beyond this literal sentence — see DECISIONS.md. |
| "We do not have a designer, so make it look clean," | N/A | All screens | — | Qualitative design guidance, not independently testable by an automated test; addressed via the design system in ui.md §1. |
| "...and it has to work well on phones because most students only have their phone." | FR-021 | All screens, especially S4 | `responsive.spec: all screens usable at 375px width with tap targets >= 44px` | — |
| "Can you have something I can click through by Thursday?" | N/A | — | — | Process/deadline, not a product requirement. |

## Operational needs named in this scope review (not explicit brief sentences, but decided in-scope)

| Source | FR ID(s) | Screen(s) | Planned automated test(s) | Notes |
|---|---|---|---|---|
| Admin needs to manage classes and users as the school's structure changes | FR-002, FR-003, FR-028, FR-029, FR-030, FR-031, FR-031a, FR-031b | A2, A3, A4, A5 | `admin.spec: create/rename/archive a class`, `admin.spec: class with students or quizzes cannot be deleted`, `admin.spec: move student preserves past attempts and updates future quiz visibility`, `admin.spec: deactivated user cannot log in but history is retained` | Not asked for explicitly in the brief; recorded under "Built but not asked for" in DECISIONS.md. |
| Grace period / deadline precision | FR-008 | S4 | `attempt.spec: submission within 10s grace after deadline is accepted`, `attempt.spec: starting a new attempt after closes_at is blocked even within the grace window` | Precision decision refining "time limit" and "date range" above. |
| Submit confirmation surfaces unanswered questions before an irreversible submit | FR-007, FR-009 | S5 | `attempt.spec: submit confirmation lists unanswered question numbers`, `attempt.spec: submitting with unanswered questions scores them as 0` | Not a distinct brief sentence — a UX safeguard for the "one attempt" rule above. |
| Post-close answer review, kept separate from the immediate score | FR-010 | S7 | `scoring.spec: review only accessible after quiz closes`, `scoring.spec: review shows correct answer and points delta per question` | Refines "see their score at the end" — the breakdown is deliberately delayed past close, per DECISIONS.md. |

## "What to deliver" (repo-level deliverables)

| Item | FR ID(s) | Artifact | Verification | Notes |
|---|---|---|---|---|
| 1. Complete source code in the repo (no build folder/zip/deploy-only link) | N/A | Repository itself | Manual check before submission: no `dist/`, `build/`, or `.zip` committed as the source of truth | Repo-structure requirement, not an app FR. |
| 2. README.md: one-command run, sample data loading, demo logins | N/A | `README.md` | Manual smoke test: `docker compose up --build` succeeds from a clean checkout, seed command loads data, documented demo logins work | Kept accurate per CLAUDE.md's documentation duties; update in the same commit as any script/port/login change. |
| 3. DECISIONS.md (assumptions / built but not asked for / deliberately left out / next week) | N/A | `DECISIONS.md` | Manual review — this file itself | Already created and kept current alongside this spec. |
| 4. AI_USAGE.md (+ CLAUDE.md) | N/A | `AI_USAGE.md`, `CLAUDE.md` | Manual review; `AI_USAGE.md` written in the final phase from `notes/ai-log.md` per CLAUDE.md | Not written yet — scheduled for the final phase per CLAUDE.md's documentation duties. |
| 5. Automated tests for the most important parts | All FR IDs (see test columns above) | `server/tests/`, `client/tests/` | The planned test suite in this table, executed via `npm test` | This table's test column is the coverage plan; constitution Principle VI requires scoring/timing/attempt tests to be written before the corresponding change. |
| 6. Commit history showing progression | N/A | Git history | Manual review via `git log` | Enforced by the constitution's Workflow & Commit Discipline (small, conventional commits). |

## Gap check

Every sentence in "The brief" and every "What to deliver" item above resolves to either a concrete FR (or set of FRs) or an explicit N/A with a stated reason (motivation, process, qualitative guidance, or a repo-level deliverable rather than an app behavior). No brief requirement was found without a corresponding FR — the two gaps identified during this review (Arabic UI being only content-deep, and no admin path to fix class/roster mistakes) were closed by adding FR-033–FR-038 and FR-028–FR-031d to `spec.md` in this same pass, rather than being left as open gaps here.
