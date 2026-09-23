# Contract: Admin — Users

Schemas in `shared/src/schemas/user.schema.ts`. **Auth**: ADMIN on every endpoint below.

## `GET /api/admin/users`

**FRs**: (list view backing FR-001a/FR-031a). **Screens**: A4. Response `200`: `{ id, name, username, role, className?, status }[]`.

## `POST /api/admin/users`

**FRs**: FR-031. **Screens**: A4. Request (`userCreateSchema`): `{ name, role, classId? }` (`classId` required iff `role = STUDENT`, FR-003). Username and initial password are generated server-side identically to import (FR-001, FR-001a) — response `201`: `{ userId, username, temporaryPassword }`, shown once, same as the import-confirm response (FR-031b: "behaves identically to an imported account").

## `POST /api/admin/users/:userId/reset-password`

**FRs**: FR-001b. **Screens**: A4. No body. Response `200`: `{ temporaryPassword }` — shown once.

## `POST /api/admin/users/:userId/deactivate` and `.../reactivate`

**FRs**: FR-031a. **Screens**: A4. No body. Toggles `status`. A `DEACTIVATED` user's session (if any) is destroyed server-side immediately (this is exactly why sessions are server-stored rather than stateless JWTs — research.md).

Errors on all of the above: `404 NotFoundError` for an unknown `userId`.
