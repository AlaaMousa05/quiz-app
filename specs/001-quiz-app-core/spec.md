# Feature Specification: Quiz App Core (Clickable MVP)

**Feature Branch**: `001-quiz-app-core`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "Build the application described in docs/brief.md. It is a clickable first version for the client. Real data will arrive later as spreadsheets (students, teachers, one quiz), so importing spreadsheets is in scope. Users: admin (Nour), teachers, students. Classes: 10A, 10B, 11A."

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

---

### User Story 2 - Teacher Builds and Publishes a Quiz (Priority: P2)

A teacher creates a quiz for one of their classes: a title, a time limit (default 20 minutes), an open date range, whether wrong answers lose points, and a set of multiple-choice questions (typically 15, four options each, each with its own point value and one correct option).

**Why this priority**: Without a way to author quizzes, there is nothing for students to take. This is the second most critical path after the student experience, and can be built and tested using the student flow's seeded data as a stand-in until this exists.

**Independent Test**: Log in as a teacher, create a quiz with a handful of questions and a marking scheme, save it, and confirm it appears (only) in that teacher's own quiz list with the configured settings intact.

**Acceptance Scenarios**:

1. **Given** a teacher is creating a quiz, **When** they add a question, **Then** they must supply exactly four options, mark exactly one as correct, and set a point value before the question can be saved.
2. **Given** a teacher sets an open date range for a quiz, **When** the range is saved, **Then** students can only start the quiz while the current time is within that range.
3. **Given** a teacher enables "negative marking" for a quiz with a penalty fraction, **When** a student answers a question incorrectly, **Then** that question's score is reduced by the penalty fraction times its point value; when disabled, a wrong or unanswered question scores zero.
4. **Given** a teacher tries to view or edit another teacher's quiz, **When** they attempt to access it, **Then** access is denied.

---

### User Story 3 - Admin Imports Students, Teachers and a Quiz from Spreadsheets (Priority: P3)

The admin (Nour) uploads a spreadsheet of students (with name and class), a spreadsheet of teachers, and a spreadsheet describing one quiz's questions, and the system creates the corresponding accounts, class rosters, and quiz content without manual re-entry.

**Why this priority**: The brief is explicit that real data will arrive as spreadsheets; without import, every subsequent demo depends on hand-entering ~60+ students and their teachers, which does not reflect how the client will actually onboard.

**Independent Test**: Upload a sample student spreadsheet, a sample teacher spreadsheet, and a sample quiz spreadsheet, and confirm the resulting accounts, class rosters (10A/10B/11A), and quiz questions match the spreadsheet contents, with a per-row error report for any rows that failed to import.

**Acceptance Scenarios**:

1. **Given** a well-formed student spreadsheet listing name and class for each row, **When** the admin imports it, **Then** one student account per row is created and assigned to the named class (10A, 10B, or 11A).
2. **Given** a spreadsheet row is missing a required field or names a class that does not exist, **When** the import runs, **Then** that row is rejected with a specific reason and all other valid rows still import successfully.
3. **Given** a quiz spreadsheet listing questions, four options, the correct option, and points per question, **When** the admin imports it, **Then** a quiz is created with those questions ready for a teacher to review and publish.
4. **Given** an import file has already been processed once, **When** the admin imports the same student or teacher again, **Then** the system does not create a duplicate account for that person.

---

### User Story 4 - Teacher and Admin Review Quiz Results (Priority: P4)

A teacher views the results of their own quiz across all students who attempted it (or did not attempt it), and the admin can view results across any class or teacher.

**Why this priority**: This is the "I also want to see how the students did" requirement from the brief. It depends on attempts existing (User Story 1) and is lower risk to leave for last in a first clickable version.

**Independent Test**: With several completed attempts seeded for a quiz, log in as that quiz's teacher and confirm the results list shows each student's score and attempt status; confirm a different teacher cannot see it.

**Acceptance Scenarios**:

1. **Given** a quiz has one or more submitted attempts, **When** the owning teacher opens its results, **Then** they see each enrolled student's status (not started / in progress / submitted) and score.
2. **Given** the admin opens results for any class or quiz, **When** the page loads, **Then** results are shown regardless of which teacher owns the quiz.
3. **Given** a teacher who does not own a quiz, **When** they try to view its results, **Then** access is denied.

### Edge Cases

- Student closes the browser tab or loses connection mid-attempt, then returns before time expires: the in-progress attempt and remaining time MUST resume from server-tracked state, not restart.
- Student opens the same quiz in two browser tabs at once: only one attempt record MUST ever be created; the second tab MUST reflect the same in-progress or completed state, never a second independent attempt.
- Student's device clock is wrong or manipulated: MUST have no effect, since the server is the sole authority on elapsed time and deadlines.
- A submission arrives at the server after the quiz's close date/time or after the per-attempt time limit has elapsed (e.g., delayed network request): the server MUST evaluate it against the deadline it recorded when the attempt started, not the client-reported time.
- Spreadsheet import contains a row for a person who already exists (matched by name/class or teacher name): MUST be skipped as a duplicate rather than creating a second account.
- Spreadsheet import file is malformed (wrong columns, empty file, unsupported format): the whole import MUST fail clearly rather than partially importing unpredictable data.
- A quiz has zero questions: it MUST NOT be publishable/openable to students until at least one question exists.
- Negative marking would otherwise drive a student's total score below zero: the total MUST be floored at zero for display and reporting.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support three roles — admin, teacher, and student — each with a distinct login using a username (no email address required). Student usernames MUST be a student ID in the form of class code + sequence number (e.g., `S10A01`); teacher usernames MUST be a short generated handle.
- **FR-001a**: System MUST generate a random initial password for every account created (via import or direct creation) and MUST let the admin view/print those initial passwords once, grouped as a per-class credentials page for students.
- **FR-001b**: System MUST let the admin reset any user's password, generating a new random password to be handed out the same way. Self-service password reset and forced password change are explicitly out of scope for this version.
- **FR-002**: System MUST allow only the admin to create and manage the set of classes (10A, 10B, 11A) and teacher accounts.
- **FR-003**: Every student account MUST belong to exactly one class.
- **FR-004**: System MUST let a teacher create a quiz consisting of a title, a time limit (default 20 minutes), an open date/time range, a per-quiz negative-marking setting, and a list of questions.
- **FR-005**: Each quiz question MUST have exactly four answer options, exactly one designated correct option, and its own point value.
- **FR-006**: System MUST prevent a student from starting a quiz outside its configured open date/time range.
- **FR-007**: System MUST prevent a student from starting more than one attempt on the same quiz, enforced so that it cannot be bypassed by retrying, refreshing, or opening multiple tabs.
- **FR-008**: System MUST enforce each attempt's time limit using server-recorded start time; the server, not the client, MUST determine when an attempt's time has expired.
- **FR-009**: System MUST automatically finalize and score an attempt when its time limit is reached, using whichever answers were recorded at that point.
- **FR-010**: System MUST NOT reveal whether any answer is correct, or the correct answer, to a student before their attempt is submitted or auto-finalized.
- **FR-011**: System MUST compute each attempt's score entirely on the server from the stored answer key, and MUST NOT accept a client-submitted score.
- **FR-012**: When a quiz's negative-marking setting is enabled, an incorrect answer MUST reduce the student's score for that question by a penalty fraction (default 0.25, configurable per quiz from 0 to 1) multiplied by that question's point value; when disabled, or when a question is left unanswered, it MUST score zero for that question.
- **FR-012a**: A new quiz's negative-marking setting (enabled/disabled and penalty fraction) MUST default to the creating teacher's profile-level default, which the teacher can override per quiz.
- **FR-012b**: A student's total score for an attempt MUST be floored at zero; negative-marking penalties MUST NOT push the total below zero.
- **FR-013**: System MUST show the student their total score immediately after their attempt is submitted or auto-finalized.
- **FR-014**: System MUST let a teacher view results (status and score per student) only for quizzes that teacher owns.
- **FR-015**: System MUST let the admin view results for any class, teacher, or quiz.
- **FR-016**: System MUST let the admin import students from a spreadsheet, creating one account per valid row and assigning each to an existing class.
- **FR-017**: System MUST let the admin import teachers from a spreadsheet, creating one account per valid row.
- **FR-018**: System MUST let the admin import a quiz (with its questions, options, correct answers, and points) from a spreadsheet.
- **FR-019**: System MUST report, per row, which spreadsheet rows failed to import and why, without discarding the rows that succeeded.
- **FR-020**: System MUST skip re-importing a person who already has an account rather than creating a duplicate.
- **FR-021**: System MUST render all pages usably on a 375px-wide screen, with interactive elements large enough to tap reliably.
- **FR-022**: System MUST correctly display Arabic student names and Arabic-language quiz content, including proper right-to-left presentation.
- **FR-023**: System MUST require a quiz to have at least one question before it can be opened to students.

### Key Entities

- **User**: A person with a role (admin, teacher, or student), a name, a username, and a password (system-generated, admin-resettable). Students additionally belong to a class and have a student-ID-style username (e.g., `S10A01`); teachers additionally own the quizzes they create and have a default negative-marking preference (enabled/disabled, penalty fraction) applied to new quizzes.
- **Class**: One of the school's groups (10A, 10B, 11A) that students belong to.
- **Quiz**: A named, timed assessment owned by one teacher, with an open date/time range, a time limit, a negative-marking setting, and an ordered set of questions. Must have at least one question to be opened to students.
- **Question**: Belongs to one quiz; has question text, exactly four options, one correct option, and a point value.
- **Attempt**: Represents one student's single try at one quiz; tracks start time, submission/finalization time, per-question answers selected, status (in progress / submitted / auto-finalized), and the computed score. Unique per student per quiz.
- **Import Batch**: Represents one spreadsheet upload (students, teachers, or a quiz); tracks which rows succeeded, which failed, and why, for the admin to review.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student can go from login to seeing their score for a 15-question quiz in a single sitting, without any page requiring more than a few taps to navigate.
- **SC-002**: Zero duplicate attempts or double-scored attempts occur across double-submit, refresh, two-tab, and late-submission testing scenarios.
- **SC-003**: A teacher can fully configure a 15-question quiz (time limit, date range, marking scheme, all questions) in under 15 minutes of hands-on time.
- **SC-004**: An admin can import a full class of about 20 students from a single spreadsheet with zero manual re-entry of names or classes.
- **SC-005**: Every screen in the product remains fully usable (no horizontal scrolling, all controls reachable and tappable) at a 375px screen width.
- **SC-006**: Every piece of Arabic content in the sample data (names and at least one Arabic quiz) displays with correct right-to-left presentation, verified by manual review.
- **SC-007**: A teacher or admin can see how a class performed on a quiz (who attempted it and each score) without needing to ask anyone else for the data.

## Assumptions

- This is a first clickable version for the client, not the production system that will hold the real ~300 students; sample data is fabricated but realistic (three classes, ~20 students each, four teachers, one 15-question quiz), matching the brief.
- "See their score at the end" means the student sees their total numeric score immediately upon submission; a full per-question answer review (which questions were right/wrong) is not required for this version and is left for a future iteration, since the brief only asks for the score.
- Spreadsheet import covers three flows explicitly named in scope: students, teachers, and one quiz's questions. Bulk import of additional entities (e.g., updating an existing quiz via re-import) is out of scope for this version.
- A quiz's date range and time limit are both authored by the teacher; if a teacher does not set a time limit, the system defaults to 20 minutes per the brief's stated norm.
- "I also want to see how the students did" is interpreted as both roles needing visibility: teachers over their own quizzes, and the admin (Nour) over everything, consistent with the least-privilege principle in the project constitution.
- Negative marking is configured per quiz (not per individual question) since the brief states it "depends on the teacher and the quiz," not on the question; the penalty is a fraction of each question's own points (default 0.25), and a teacher's profile-level default seeds new quizzes.
- Login uses usernames, not email, since no email addresses are guaranteed in the client's spreadsheets. Self-service password reset and forced password change on first login are deliberately out of scope for this version (the admin resets passwords manually); this is a known gap to record as a "next week" item in DECISIONS.md.
