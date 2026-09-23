# Contract: Admin — Classes

Schemas in `shared/src/schemas/class.schema.ts`. **Auth**: ADMIN on every endpoint below (constitution Principle III).

## `GET /api/admin/classes`

**FRs**: FR-028. **Screens**: A2. Response `200`: `{ id, name, status, studentCount, quizCount }[]`.

## `POST /api/admin/classes`

**FRs**: FR-028. **Screens**: A2. Request (`classSchema`): `{ name }`. Response `201`: `{ classId }`.

## `PATCH /api/admin/classes/:classId`

**FRs**: FR-028, FR-029. **Screens**: A3. Request: `{ name? , status?: "ACTIVE"|"ARCHIVED" }`. Setting `status: "ARCHIVED"` archives the class; setting `status: "ACTIVE"` on an archived class restores it (FR-028/FR-029) — the roster and history are untouched by either transition.

## `DELETE /api/admin/classes/:classId`

**FRs**: FR-028. **Screens**: A3. Errors: `409 ConflictError` if `studentCount > 0 OR quizCount > 0` — response names which (per ui.md A3's disabled-button-with-hint pattern, the client is expected to pre-check via the `GET` counts and disable the action, but the server enforces it regardless).

## `GET /api/admin/classes/:classId/students`

**FRs**: FR-030. **Screens**: A3. Response `200`: `{ id, name, username }[]`.

## `POST /api/admin/classes/:classId/students/:studentId/move`

**FRs**: FR-030. **Screens**: A3. Request: `{ toClassId }`. Reassigns `User.classId`; does not touch any existing `Attempt` row (they keep their original `quizId`/`studentId`, unaffected by the student's current class — FR-030). No special handling needed for "attempt in progress at time of move" beyond this, since an `Attempt` was never linked to the student's class in the first place, only to the quiz and student IDs directly.
