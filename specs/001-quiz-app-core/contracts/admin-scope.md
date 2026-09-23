# Contract: Admin — Unfiltered Quiz/Results Access

**FRs**: FR-015, FR-031c. **Auth**: ADMIN. **Screens**: A6, A7.

Per FR-031c ("same screens... without the ownership filter") there is exactly one results screen component (ui.md T5); these endpoints return the identical response shapes as `teacher-quizzes.md`'s `GET .../quizzes` and `GET .../:quizId/results`, with the ownership check (`ownerTeacherId === session.userId`) simply not applied for an ADMIN session.

## `GET /api/admin/quizzes`

Same shape as `GET /api/teacher/quizzes` (see `teacher-quizzes.md`), plus an `ownerName` field per row (A6 shows the owning teacher, which a teacher's own list doesn't need to). Optional `?groupBy=class|teacher` for A7's grouped browsing view.

## `GET /api/admin/quizzes/:quizId/results` and `.../export.csv`

Identical to `GET /api/teacher/quizzes/:quizId/results` (`teacher-quizzes.md`), reachable regardless of `ownerTeacherId`.

Implementation note: the server-side controller for these two routes is a thin wrapper that calls the exact same `quizService.getResults(quizId)` used by the teacher-scoped route, differing only in which middleware guard ran first (`requireOwnership` vs. `requireRole('ADMIN')`) — this is what keeps "one results screen, two access paths" true at the code level as well as the UI level (Principle IX: no duplicated logic between an admin and teacher variant).
