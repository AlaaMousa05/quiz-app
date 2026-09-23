# Decisions

This log records every assumption, scope call, and deliberate omission made while building the quiz app, per CLAUDE.md's documentation duties. Entries are added as decisions are made, not reconstructed after the fact.

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
- The application's own UI text is in English for this version, kept separate from logic so it can be translated later; this is independent of Arabic content (names, quiz text), which is fully supported today. *Why: the client and brief are in English; Arabic support is about the data, not the app's chrome, for this phase.*

## Built but not asked for

- A spreadsheet import preview step (with per-row errors) that requires explicit confirmation before anything is saved, rather than importing directly. *Why: real spreadsheets from a school will have messy rows; a silent partial import would be worse than showing what will happen first.*
- Support for both XLSX and CSV, including UTF-8-BOM and Windows-1256 CSV encodings. *Why: Arabic-language spreadsheets exported from older tools commonly use these encodings; without this, Arabic names would arrive corrupted.*
- A draft/publish lifecycle for quizzes (instead of quizzes being visible as soon as created). *Why: a teacher (or admin importing on their behalf) needs to review imported or hand-built content before students can see it.*
- Results include class averages and per-question percent-correct, not just a raw list of scores. *Why: "see how the students did" is more useful with a difficulty signal per question than with scores alone, and it's cheap to compute from data already being stored.*
- CSV export of results. *Why: Nour will want to share or archive results outside the app; this was a natural extension of the results view already being built.*
- Admin-driven password reset with a re-printable credentials page. *Why: someone will lose their password; the app needs an answer that doesn't depend on email.*
- A teacher-level default for the negative-marking setting, applied to new quizzes. *Why: a teacher who always uses (or never uses) negative marking shouldn't have to reconfigure it on every quiz.*

## Deliberately left out

- Email of any kind (notifications, invitations, password reset links). *Why: no email integration exists in this version; usernames avoid needing one.*
- Self-service password reset and forced password change on first login. *Why: out of scope for a first clickable version without email; admin-driven reset covers the essential need.*
- Question types other than single-answer multiple choice with exactly four options. *Why: the brief only describes this format.*
- Proctoring, anti-cheat, or plagiarism detection beyond the specific integrity rules already built (single attempt, server-side timing, autosave/resume, tamper-resistant scoring). *Why: not requested, and meaningfully more effort than the brief's scope justifies.*
- Re-importing a spreadsheet to update an existing quiz, class, or roster. *Why: the brief's import need is initial onboarding, not ongoing sync; each import creates new records, it doesn't reconcile against old ones.*
- Translating the application's own UI into Arabic. *Why: the brief's specific requirement is that quiz content and names support Arabic, not that the app chrome does — deferred rather than dropped, since UI strings are kept centralized for it.*

## Next week

- Self-service password reset (with email or another out-of-band channel) and a forced password change on first login.
- Arabic translation of the application's UI itself, using the centralized string setup already in place.
- A way to update an existing quiz's questions via re-import, instead of only creating new quizzes.
- Additional question types (e.g., short answer, multiple-select) if the client asks for them.
- Richer analytics (trends over time, per-student history across quizzes) once there's more than one quiz's worth of data to look at.
