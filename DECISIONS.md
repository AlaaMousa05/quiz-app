# Decisions

This log records every assumption, scope call, and deliberate omission made while building the quiz app, per CLAUDE.md's documentation duties. Entries are added as decisions are made, not reconstructed after the fact.

## Priorities

In build order, highest first:

1. Quiz flow + timing — the core loop (start, countdown, autosave, deadline, submit) is the entire reason the client wants this.
2. Scoring/negative marking — server-side, tamper-proof, and correct is non-negotiable per the constitution.
3. One attempt — the DB-enforced uniqueness rule underpins the integrity of everything scored.
4. Auth + roles — nothing else can be built or demoed without login and role/ownership checks in place.
5. Teacher quiz creation — the only way content gets into the system for students to take.
6. Arabic UI + content — in scope from the start, not bolted on after the English version works.
7. Admin classes/users — operational tooling needed to run the system day to day, once the core loop works.
8. Results — depends on attempts existing; valuable but not blocking earlier priorities.
9. Tests throughout — written alongside each of the above per the constitution's test-first rule, not as a separate pass at the end.
10. Documentation — README, DECISIONS.md, ai-log, and AI_USAGE.md kept current phase by phase, not reconstructed at the end.

## Assumptions

- This is a first clickable version for the client, not the production system for the real ~300 students — sample data is fabricated but realistic (three classes, ~20 students each, four teachers, one 15-question quiz). *Why: matches the brief's explicit "make up some data that looks like ours" instruction.*
- A quiz's time limit defaults to 20 minutes if a teacher doesn't set one. *Why: the brief states 20 minutes as the norm.*
- "I also want to see how the students did" means both teachers (their own quizzes) and the admin (everything) need results visibility. *Why: consistent with the least-privilege principle — role-scoped by default, admin sees all.*
- Negative marking is configured per quiz, not per question, as a penalty fraction of that question's own points (default 0.25, teacher-configurable 0–1), seeded from the teacher's profile default; a student's total score floors at zero. *Why: the brief says the penalty "depends on the teacher and the quiz," not the question; a fraction of the question's own points is the simplest scheme that scales with point value.*
- A quiz is assigned to one or more classes; students only ever see quizzes assigned to their own class. *Why: needed since three classes now share the platform and nothing in the brief said quizzes are global.*
- An attempt's deadline is `min(started_at + time_limit, closes_at)`, with a 10-second grace period for network latency. *Why: makes the two independent time constraints (per-attempt limit, quiz close date) precise and testable, and tolerates real-world lag without opening a cheating window.*
- Login uses a username (student ID like `S10A01`, or a short handle for teachers), not email, since no email addresses are guaranteed in the client's spreadsheets. *Why: the client's data won't reliably include emails; a username-based scheme needs nothing external.*
- A student's initial password is system-generated and shown once to the admin on a printable per-class credentials page; the admin can reset any password, generating a new one the same way. *Why: no email integration exists to deliver credentials any other way.*
- A student ID comes from the spreadsheet's student-ID column when present and valid; otherwise the system auto-generates one in the form `S<class><number>`, unique across the system. *Why: the centre likely already has IDs for some students; auto-generating covers the rest without blocking import.*
- A quiz imported via spreadsheet gets its classes, dates, time limit, and negative-marking setting from the import flow itself, not from spreadsheet columns; the spreadsheet only carries question content. The importing teacher owns it (or the admin picks an owner when importing on a teacher's behalf), and it's saved as a draft. *Why: keeps the spreadsheet schema minimal and matches how the real quiz spreadsheet was described (just questions).*
- After submitting, a student sees only their total score; the correct/incorrect breakdown of their own attempt becomes visible only after the quiz's close date/time. *Why: prevents an early finisher from leaking the answer key to classmates still mid-attempt or who haven't started yet.*
- Once any attempt exists on a quiz, everything about it is locked except the open/close dates. *Why: changing questions, points, time limit, or negative marking mid-flight would make scores incomparable between students who attempted before vs. after the change.*
- The application's UI is fully bilingual (Arabic and English) from the start — a language toggle on login and on every page, following the browser's language by default and remembering an explicit choice per device. *Why: the brief's Arabic requirement reads as "make sure Arabic works," and a school where many students and staff are more comfortable in Arabic gets little value from Arabic-only content sitting inside an English-only shell.*
- Arabic direction is handled with `dir="rtl"` on `<html>` plus logical CSS properties only (start/end, not left/right), one string dictionary per language with no hard-coded UI text, a self-hosted Noto Sans Arabic font, and diacritic-/alef-insensitive name search. *Why: each of these is a specific, well-known failure mode for bolted-on RTL support (mirrored layouts breaking, missing glyphs, names people can't find because they typed a different alef) — building them in from the start is cheaper than retrofitting.*
- A moved student keeps their past attempts and sees only their new class's quizzes going forward; an attempt already in progress at the time of the move is allowed to finish under its original rules. *Why: reassignment is a normal school operation (transfers, correcting a data-entry mistake) and shouldn't erase history or interrupt a quiz someone is mid-way through.*
- A class can be deleted only if it has no students and no quizzes; otherwise it can only be archived. Archiving blocks new assignments but leaves existing data untouched. *Why: deleting a class with real history would silently orphan or destroy student records and results.*
- Only XLSX and UTF-8 CSV (with or without a byte-order-mark) are accepted for import; any other CSV encoding (including Windows-1256) is rejected up front with "Save as CSV UTF-8 or upload XLSX" rather than guessed at. *Why: silently mis-decoding an unsupported encoding would corrupt Arabic names invisibly, which is worse than asking the admin to re-save the file — reversed from an earlier draft decision to attempt Windows-1256 support directly, in favor of the Simplicity principle.*
- Autosave and resume-on-refresh stay in scope. *Why: with the one-attempt-per-quiz rule enforced at the database level, a refresh or dropped connection without a resume path would lock a student out of the quiz permanently with no way back in — an unacceptable failure mode for a paper-replacement tool. Server-side attempt state also makes correct timer persistence and multi-device continuation (start on one device, continue on another) come for free, rather than needing separate client-side timer-recovery logic.*

## Built but not asked for

- A spreadsheet import preview step (with per-row errors) that requires explicit confirmation before anything is saved, rather than importing directly. *Why: real spreadsheets from a school will have messy rows; a silent partial import would be worse than showing what will happen first.*
- Support for UTF-8 CSV (with or without a byte-order-mark) in addition to XLSX. *Why: Arabic-language spreadsheets commonly carry a BOM; without handling it, the first field of every row would be silently corrupted.*
- A draft/publish lifecycle for quizzes (instead of quizzes being visible as soon as created). *Why: a teacher (or admin importing on their behalf) needs to review imported or hand-built content before students can see it.*
- Results include class averages and per-question percent-correct, not just a raw list of scores. *Why: "see how the students did" is more useful with a difficulty signal per question than with scores alone, and it's cheap to compute from data already being stored.*
- CSV export of results. *Why: Nour will want to share or archive results outside the app; this was a natural extension of the results view already being built.*
- Admin-driven password reset with a re-printable credentials page. *Why: someone will lose their password; the app needs an answer that doesn't depend on email.*
- A teacher-level default for the negative-marking setting, applied to new quizzes. *Why: a teacher who always uses (or never uses) negative marking shouldn't have to reconfigure it on every quiz.*
- Full class management for the admin (create, rename, archive, view roster, move a student) and full user management (create a single user, deactivate). *Why: the brief only says "our teachers will put the quizzes in," but someone has to be able to fix a mis-imported class or a student who switches sections without touching the database directly — this is the minimum admin tooling the brief implies but doesn't spell out.*
- An admin view of every quiz and every result, reusing the teacher's own screens without the ownership filter, instead of a separate admin-only reporting UI. *Why: cheaper to build and keeps the two views from drifting apart, and it directly answers "I also want to see how the students did" for the person who asked.*
- A plain-language negative-marking explanation on the quiz intro screen, in both languages. *Why: a student shouldn't have to infer whether wrong answers cost them points; telling them up front is cheap and prevents a bad surprise at the score screen.*
- Auto-creating a class from an unrecognized name during student import, instead of rejecting the row. *Why: the centre's class list will change over time (new sections), and rejecting valid students over a class that simply doesn't exist yet in our system is worse than creating it.*

## Deliberately left out

- Email of any kind (notifications, invitations, password reset links). *Why: no email integration exists in this version; usernames avoid needing one.*
- Self-service password reset and forced password change on first login. *Why: out of scope for a first clickable version without email; admin-driven reset covers the essential need.*
- Question types other than single-answer multiple choice with exactly four options. *Why: the brief only describes this format.*
- Proctoring, anti-cheat, or plagiarism detection beyond the specific integrity rules already built (single attempt, server-side timing, autosave/resume, tamper-resistant scoring). *Why: not requested, and meaningfully more effort than the brief's scope justifies.*
- Re-importing a spreadsheet to update an existing quiz, class, or roster. *Why: the brief's import need is initial onboarding, not ongoing sync; each import creates new records, it doesn't reconcile against old ones.*
- CSV encodings other than UTF-8, most notably Windows-1256. *Why: correctly detecting and transcoding legacy encodings adds real complexity for a first version; rejecting with a clear message ("Save as CSV UTF-8 or upload XLSX") is simple, honest, and unblocks the admin in under a minute via Excel's "CSV UTF-8" save option.*
- Syncing a user's language preference across devices or browsers for the same account. *Why: the toggle is device-local (e.g., browser storage) for this version; account-level sync would need a place to store per-user settings that doesn't exist yet.*

## Next week

- Self-service password reset (with email or another out-of-band channel) and a forced password change on first login.
- Direct support for Windows-1256-encoded CSV uploads, instead of asking the admin to re-save as UTF-8.
- A way to update an existing quiz's questions via re-import, instead of only creating new quizzes.
- Additional question types (e.g., short answer, multiple-select) if the client asks for them.
- Richer analytics (trends over time, per-student history across quizzes) once there's more than one quiz's worth of data to look at.
- Syncing a user's language preference to their account so it follows them across devices.
