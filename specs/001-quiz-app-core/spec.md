# Feature Specification: Quiz App Core (Clickable MVP)

**Feature Branch**: `001-quiz-app-core`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "Build the application described in docs/brief.md. It is a clickable first version for the client. Real data will arrive later as spreadsheets (students, teachers, one quiz), so importing spreadsheets is in scope. Users: admin (Nour), teachers, students. Classes: 10A, 10B, 11A."

## Clarifications

### Session 2026-09-23

- Q: When the admin imports a quiz via spreadsheet, who becomes its owning teacher and which classes is it assigned to? → A: Teachers can import their own quiz spreadsheets (owner = importing teacher); if the admin imports one, the admin picks the owning teacher. Classes, time limit, open/close dates, and negative-marking settings are all chosen in the import flow, not read from the spreadsheet — the spreadsheet contains only questions, options, the correct option, and points. The resulting quiz is saved as a draft until explicitly published.
- Q: How is a student's login ID (e.g. `S10A01`) generated when importing students from a spreadsheet? → A: Use the spreadsheet's student-ID column when present and valid. If missing or empty for a row, auto-generate one in the form `S<class><number>`, unique across the system. Duplicate IDs (within the file or against existing accounts) are reported as per-row errors in the import preview.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Student Takes a Timed Quiz and Sees Their Score (Priority: P1)

A student logs in, opens a quiz that is currently within its open date range, answers up to 15 multiple-choice questions within the quiz's time limit, submits, and immediately sees their total score. If they try to open the same quiz again, they cannot start a second attempt.

**Why this priority**: This is the entire reason the client wants the system — replacing a paper quiz process. Without this working end to end, nothing else in the product has value.

**Independent Test**: Using a pre-seeded student account and a pre-seeded open quiz, log in as the student, complete the quiz within the time limit, submit, and confirm a score is shown and a second attempt is blocked. Delivers the core value on its own, independent of whether quiz authoring or reporting exist yet.

**Acceptance Scenarios**:

1. **Given** a quiz is open (current time within its date range) and the student has no prior attempt, **When** the student starts the quiz, **Then** a countdown for the quiz's time limit begins and questions are shown one set at a time with no indication of which answers are correct.
2. **Given** the student has answered all questions and clicks submit before time expires, **When** the submission is processed, **Then** the server computes the score from the stored answer key and displays the final score to the student.
3. **Given** the student's time limit expires while questions are unanswered, **When** the timer reaches zero, **Then** the system automatically submits whatever answers were selected so far and scores it as a normal attempt.
4. **Given** a student has already submitted an attempt for a quiz, **When** they try to open that quiz again, **Then** they are shown their existing result instead of a new attempt screen.
5. **Given** the current date is outside the quiz's open date range, **When** a student tries to start it, **Then** the system blocks the attempt and explains the quiz is not currently open.
6. **Given** a quiz is not assigned to the student's class, **When** the student looks for it, **Then** the quiz does not appear in their list and cannot be started directly.
7. **Given** a student closes the browser tab or loses connection mid-attempt, **When** they return before the deadline, **Then** the attempt resumes with the same remaining time and all previously selected answers already in place (answers are saved as each one is selected).

---

### User Story 2 - Teacher Builds and Publishes a Quiz (Priority: P2)

A teacher creates a quiz for one or more of their classes: a title, a time limit (default 20 minutes), an open date range, whether wrong answers lose points, and a set of multiple-choice questions (typically 15, four options each, each with its own point value and one correct option). The quiz starts as a draft and is not visible to students until the teacher explicitly publishes it.

**Why this priority**: Without a way to author quizzes, there is nothing for students to take. This is the second most critical path after the student experience, and can be built and tested using the student flow's seeded data as a stand-in until this exists.

**Independent Test**: Log in as a teacher, create a quiz with a handful of questions and a marking scheme, save it, and confirm it appears (only) in that teacher's own quiz list with the configured settings intact.

**Acceptance Scenarios**:

1. **Given** a teacher is creating a quiz, **When** they add a question, **Then** they must supply exactly four options, mark exactly one as correct, and set a point value before the question can be saved.
2. **Given** a teacher sets an open date range for a quiz, **When** the range is saved, **Then** students can only start the quiz while the current time is within that range.
3. **Given** a teacher enables "negative marking" for a quiz with a penalty fraction, **When** a student answers a question incorrectly, **Then** that question's score is reduced by the penalty fraction times its point value; when disabled, a wrong or unanswered question scores zero.
4. **Given** a teacher tries to view or edit another teacher's quiz, **When** they attempt to access it, **Then** access is denied.
5. **Given** a quiz already has at least one attempt (in progress or submitted), **When** the teacher tries to edit its questions, options, time limit, negative-marking setting, or assigned classes, **Then** the edit is rejected; only the open/close dates remain editable at that point.
6. **Given** a teacher saves a quiz as a draft, **When** they have not yet clicked publish, **Then** the quiz is not visible or startable by any student regardless of its configured dates.

---

### User Story 3 - Import Students, Teachers and a Quiz from Spreadsheets (Priority: P3)

The admin (Nour) uploads a spreadsheet of students (with name, class, and optionally a student ID) and a spreadsheet of teachers, and the system creates the corresponding accounts and class rosters without manual re-entry. Separately, a teacher (or the admin, on a teacher's behalf) imports a quiz's questions from a spreadsheet; the classes, dates, time limit, and negative-marking setting are chosen in the import flow itself, not read from the file, and the result is saved as a draft.

**Why this priority**: The brief is explicit that real data will arrive as spreadsheets; without import, every subsequent demo depends on hand-entering ~60+ students and their teachers, which does not reflect how the client will actually onboard.

**Independent Test**: Upload a sample student spreadsheet, a sample teacher spreadsheet, and a sample quiz spreadsheet, and confirm the resulting accounts, class rosters (10A/10B/11A), and draft quiz questions match the spreadsheet contents, with a per-row error report shown in a preview for any rows that failed before anything is saved.

**Acceptance Scenarios**:

1. **Given** a well-formed student spreadsheet listing name, class, and (optionally) a student ID for each row, **When** the admin previews and confirms the import, **Then** one student account per row is created and assigned to the named class (10A, 10B, or 11A), using the file's student ID where valid or an auto-generated one otherwise.
2. **Given** a spreadsheet row is missing a required field, names a class that does not exist, or has a student ID that duplicates another row or an existing account, **When** the preview is generated, **Then** that row is flagged with a specific reason before saving, and all other valid rows can still be confirmed and imported.
3. **Given** a quiz spreadsheet listing questions, four options, the correct option, and points per question, **When** a teacher (or the admin, choosing that teacher as owner) imports it and selects the classes, dates, time limit, and negative-marking setting, **Then** a draft quiz is created with those questions, ready for the owning teacher to review and publish.
4. **Given** an import file has already been processed once, **When** the admin imports the same student or teacher again, **Then** the system does not create a duplicate account for that person.
5. **Given** any student or quiz spreadsheet is uploaded, **When** the system reads it, **Then** it accepts both XLSX and CSV files and correctly reads Arabic names regardless of common encoding quirks (UTF-8 with byte-order-mark, or legacy Windows-1256 CSV exports).

---

### User Story 4 - Teacher and Admin Review Quiz Results (Priority: P4)

A teacher views the results of their own quiz across all students who attempted it (or did not attempt it), including the class average and how many students got each question right, and can export the results as a spreadsheet-friendly file. The admin can view the same results across any class or teacher.

**Why this priority**: This is the "I also want to see how the students did" requirement from the brief. It depends on attempts existing (User Story 1) and is lower risk to leave for last in a first clickable version.

**Independent Test**: With several completed attempts seeded for a quiz, log in as that quiz's teacher and confirm the results list shows each student's score and attempt status; confirm a different teacher cannot see it.

**Acceptance Scenarios**:

1. **Given** a quiz has one or more submitted attempts, **When** the owning teacher opens its results, **Then** they see each enrolled student's status (not started / in progress / submitted) and score, the class average score, and the percentage of students who answered each question correctly.
2. **Given** the admin opens results for any class or quiz, **When** the page loads, **Then** results are shown regardless of which teacher owns the quiz.
3. **Given** a teacher who does not own a quiz, **When** they try to view its results, **Then** access is denied.
4. **Given** a teacher or admin is viewing a quiz's results, **When** they choose to export, **Then** a CSV file of the results table is produced.
5. **Given** a quiz's close date/time has passed, **When** a student who attempted it views their own attempt, **Then** they can see which of their answers were correct, in addition to their score; before the close date/time, only the score is shown.

### Edge Cases

- Student closes the browser tab or loses connection mid-attempt, then returns before the deadline: the in-progress attempt, its remaining time, and every answer already selected (autosaved as each one was picked) MUST resume from server-tracked state, not restart or lose progress.
- Student opens the same quiz in two browser tabs at once: only one attempt record MUST ever be created; the second tab MUST reflect the same in-progress or completed state, never a second independent attempt.
- Student's device clock is wrong or manipulated: MUST have no effect, since the server is the sole authority on elapsed time and deadlines.
- A submission arrives at the server slightly after the computed deadline (e.g., delayed network request): the server MUST accept it if it arrives within a 10-second grace period after the deadline (`min(started_at + time_limit, closes_at)`), and MUST reject or auto-finalize using only answers already saved if it arrives later than that.
- Spreadsheet import contains a row for a person who already exists (matched by student ID for students, or by name for teachers): MUST be skipped as a duplicate rather than creating a second account, and reported as such in the preview.
- A student spreadsheet row's student ID duplicates another row in the same file or an existing account's ID: MUST be flagged as a per-row error in the import preview rather than silently overwritten or renumbered.
- Spreadsheet import file is malformed (wrong columns, empty file, unsupported format): the whole import MUST fail clearly at the preview stage, before anything is saved, rather than partially importing unpredictable data.
- A quiz has zero questions: it MUST NOT be publishable/openable to students until at least one question exists.
- A quiz is left as a draft (never published): it MUST NOT appear to students under any circumstance, even if its dates would otherwise make it open.
- Negative marking would otherwise drive a student's total score below zero: the total MUST be floored at zero for display and reporting.
- A teacher attempts to edit a quiz's questions, options, time limit, negative-marking setting, or assigned classes after any attempt exists: the edit MUST be rejected; only the open/close dates remain editable at that point.
- A student not in any of a quiz's assigned classes attempts to access it directly (e.g., a guessed link): access MUST be denied the same as if the quiz did not exist.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support three roles — admin, teacher, and student — each with a distinct login using a username (no email address required). Student usernames MUST be a student ID in the form of class code + sequence number (e.g., `S10A01`); teacher usernames MUST be a short generated handle.
- **FR-001a**: System MUST generate a random initial password for every account created (via import or direct creation) and MUST let the admin view/print those initial passwords once, grouped as a per-class credentials page for students.
- **FR-001b**: System MUST let the admin reset any user's password, generating a new random password to be handed out the same way. Self-service password reset and forced password change are explicitly out of scope for this version.
- **FR-002**: System MUST allow only the admin to create and manage the set of classes (10A, 10B, 11A) and teacher accounts.
- **FR-003**: Every student account MUST belong to exactly one class.
- **FR-004**: System MUST let a teacher create a quiz consisting of a title, a time limit (default 20 minutes), an open date/time range, one or more assigned classes, a per-quiz negative-marking setting, and a list of questions. A newly created quiz MUST start as a draft, invisible to students, until the owning teacher explicitly publishes it.
- **FR-005**: Each quiz question MUST have exactly four answer options, exactly one designated correct option, and its own point value.
- **FR-006**: System MUST prevent a student from starting a quiz that is a draft, outside its configured open date/time range, or not assigned to that student's class; such a quiz MUST NOT appear in the student's quiz list.
- **FR-007**: System MUST prevent a student from starting more than one attempt on the same quiz, enforced so that it cannot be bypassed by retrying, refreshing, or opening multiple tabs.
- **FR-008**: System MUST enforce each attempt's deadline as the earlier of (attempt start time + quiz time limit) or the quiz's close date/time, computed and tracked entirely from server-recorded times; the server, not the client, MUST determine when an attempt's time has expired. A submission MUST be accepted if it reaches the server within a 10-second grace period after that deadline, to absorb network latency.
- **FR-008a**: System MUST save each answer selection to the server immediately (autosave), so that a refreshed or reconnected session resumes the same attempt with all previously selected answers and the correct remaining time intact.
- **FR-009**: System MUST automatically finalize and score an attempt when its deadline (including grace period) is reached, using whichever answers were recorded at that point.
- **FR-010**: System MUST NOT reveal whether any answer is correct, or the correct answer, to a student before their attempt is submitted or auto-finalized. After their attempt is submitted, a student MUST see only their total score; the correct/incorrect breakdown of their own attempt becomes visible to them only after the quiz's close date/time has passed.
- **FR-011**: System MUST compute each attempt's score entirely on the server from the stored answer key, and MUST NOT accept a client-submitted score.
- **FR-012**: When a quiz's negative-marking setting is enabled, an incorrect answer MUST reduce the student's score for that question by a penalty fraction (default 0.25, configurable per quiz from 0 to 1) multiplied by that question's point value; when disabled, or when a question is left unanswered, it MUST score zero for that question.
- **FR-012a**: A new quiz's negative-marking setting (enabled/disabled and penalty fraction) MUST default to the creating teacher's profile-level default, which the teacher can override per quiz.
- **FR-012b**: A student's total score for an attempt MUST be floored at zero; negative-marking penalties MUST NOT push the total below zero.
- **FR-013**: System MUST show the student their total score immediately after their attempt is submitted or auto-finalized.
- **FR-014**: System MUST let a teacher view results (status and score per student) only for quizzes that teacher owns.
- **FR-015**: System MUST let the admin view results for any class, teacher, or quiz.
- **FR-016**: System MUST let the admin import students from a spreadsheet, creating one account per valid row and assigning each to an existing class. Each row's student ID MUST come from the spreadsheet's student-ID column when present and valid, or be auto-generated in the form `S<class><number>` (unique across the system) when absent.
- **FR-017**: System MUST let the admin import teachers from a spreadsheet, creating one account per valid row.
- **FR-018**: System MUST let a teacher import a quiz's questions, options, correct answers, and points from a spreadsheet, with the owning teacher being the importing teacher; the admin MAY also import a quiz on a teacher's behalf by selecting that teacher as owner. In both cases the classes, open/close dates, time limit, and negative-marking setting are chosen in the import flow itself (not read from the file), and the result is saved as a draft quiz per FR-004.
- **FR-019**: System MUST show a preview of every import (students, teachers, or a quiz) — including per-row errors and reasons — and require explicit confirmation before creating or saving anything; rows that fail MUST NOT block the rows that pass from being confirmed and imported.
- **FR-019a**: System MUST accept student, teacher, and quiz spreadsheets in either XLSX or CSV format, and MUST correctly read Arabic text regardless of common encoding quirks (UTF-8 with byte-order-mark, or legacy Windows-1256 CSV exports).
- **FR-020**: System MUST skip re-importing a person who already has an account (matched by student ID for students, by name for teachers) rather than creating a duplicate, and MUST flag in-file duplicate or already-used student IDs as per-row errors.
- **FR-021**: System MUST render all pages usably on a 375px-wide screen, with interactive elements large enough to tap reliably.
- **FR-022**: System MUST correctly display Arabic student names and Arabic-language quiz content, including proper right-to-left presentation.
- **FR-023**: System MUST require a quiz to have at least one question before it can be opened to students.
- **FR-024**: Once a quiz has at least one attempt (in progress, submitted, or auto-finalized), System MUST lock its questions, options, correct answers, points, time limit, negative-marking setting, and assigned classes against further edits; only its open/close dates MAY still be changed.
- **FR-025**: System MUST display all dates and times to users in Asia/Amman local time, regardless of the quiz's or student's location.
- **FR-026**: System MUST show, for each quiz, a results view listing every enrolled student's attempt status and score, the class average score, and the percentage of students who answered each question correctly.
- **FR-027**: System MUST let a teacher (for quizzes they own) or the admin (for any quiz) export a quiz's results as a CSV file.

### Key Entities

- **User**: A person with a role (admin, teacher, or student), a name, a username, and a password (system-generated, admin-resettable). Students additionally belong to a class and have a student-ID-style username (e.g., `S10A01`); teachers additionally own the quizzes they create and have a default negative-marking preference (enabled/disabled, penalty fraction) applied to new quizzes.
- **Class**: One of the school's groups (10A, 10B, 11A) that students belong to.
- **Quiz**: A named, timed assessment owned by one teacher, assigned to one or more classes, with a draft/published status, an open date/time range, a time limit, a negative-marking setting, and an ordered set of questions. Must have at least one question to be opened to students, and must be published (not draft) to be visible to them. Once any attempt exists, every field except its open/close dates is locked.
- **Question**: Belongs to one quiz; has question text, exactly four options, one correct option, and a point value.
- **Attempt**: Represents one student's single try at one quiz; tracks start time, computed deadline, submission/finalization time, per-question answers selected (autosaved as chosen), status (in progress / submitted / auto-finalized), and the computed score. Unique per student per quiz.
- **Import Batch**: Represents one spreadsheet upload (students, teachers, or a quiz's questions), in either XLSX or CSV format; tracks a row-by-row preview, which rows succeeded, which failed and why, and requires explicit confirmation before anything is saved.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student can go from login to seeing their score for a 15-question quiz in a single sitting, without any page requiring more than a few taps to navigate.
- **SC-002**: Zero duplicate attempts or double-scored attempts occur across double-submit, refresh, two-tab, and late-submission testing scenarios.
- **SC-003**: A teacher can fully configure a 15-question quiz (time limit, date range, marking scheme, all questions) in under 15 minutes of hands-on time.
- **SC-004**: An admin can import a full class of about 20 students from a single spreadsheet with zero manual re-entry of names or classes.
- **SC-005**: Every screen in the product remains fully usable (no horizontal scrolling, all controls reachable and tappable) at a 375px screen width.
- **SC-006**: Every piece of Arabic content in the sample data (names and at least one Arabic quiz) displays with correct right-to-left presentation, verified by manual review.
- **SC-007**: A teacher or admin can see how a class performed on a quiz — who attempted it, each score, the class average, and per-question difficulty — without needing to ask anyone else for the data, and can hand that data to someone else via a CSV export.

## Assumptions

- This is a first clickable version for the client, not the production system that will hold the real ~300 students; sample data is fabricated but realistic (three classes, ~20 students each, four teachers, one 15-question quiz), matching the brief.
- "See their score at the end" means the student sees their total numeric score immediately upon submission; a full per-question correct/incorrect breakdown of their own attempt becomes visible to them only after the quiz's close date/time, so it cannot leak the answer key to classmates who have not yet attempted (or are mid-attempt on) the same quiz.
- Spreadsheet import covers three flows explicitly named in scope: students, teachers, and one quiz's questions. Bulk import of additional entities (e.g., updating an existing quiz via re-import) is out of scope for this version.
- A quiz's date range and time limit are both authored by the teacher; if a teacher does not set a time limit, the system defaults to 20 minutes per the brief's stated norm.
- "I also want to see how the students did" is interpreted as both roles needing visibility: teachers over their own quizzes, and the admin (Nour) over everything, consistent with the least-privilege principle in the project constitution.
- Negative marking is configured per quiz (not per individual question) since the brief states it "depends on the teacher and the quiz," not on the question; the penalty is a fraction of each question's own points (default 0.25), and a teacher's profile-level default seeds new quizzes.
- Login uses usernames, not email, since no email addresses are guaranteed in the client's spreadsheets. Self-service password reset and forced password change on first login are deliberately out of scope for this version (the admin resets passwords manually); this is a known gap to record as a "next week" item in DECISIONS.md.
- The application's own UI text (labels, buttons, navigation) is in English for this version; all UI copy is kept separate from logic so it can be translated later without a rework. This does not affect Arabic content (student names, quiz questions), which is fully supported today per FR-022.
- A quiz can be authored directly in the UI (User Story 2) or imported from a spreadsheet (User Story 3); both paths produce the same kind of draft quiz and are subject to the same publish step and locking rules, so there is exactly one quiz lifecycle rather than two.

## Out of Scope

- Email of any kind (notifications, invitations, password reset links) — the system has no email integration in this version.
- Self-service password reset and forced password change on first login — the admin resets passwords manually and hands out the new one (see FR-001b).
- Question types other than single-answer multiple choice with exactly four options.
- Proctoring, anti-cheat, or plagiarism detection beyond the specific integrity rules already specified (single attempt, server-side timing, autosave/resume, tamper-resistant scoring).
