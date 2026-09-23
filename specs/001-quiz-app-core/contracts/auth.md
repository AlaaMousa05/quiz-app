# Contract: Auth

Schemas referenced live in `shared/src/schemas/auth.schema.ts`.

## `POST /api/auth/login`

**FRs**: FR-001. **Auth**: none (public). **Screens**: S1.

Request (`loginSchema`): `{ username: string; password: string }`

Response `200`: `{ role: "ADMIN"|"TEACHER"|"STUDENT"; name: string; username: string }` — sets an `httpOnly` session cookie (`connect-pg-simple`-backed); no token in the body. Returning `username` here lets the client hydrate its session cache directly instead of an extra `GET /me` round trip.

Errors: `401 InvalidCredentialsError` (wrong username/password — same message either way, never reveals which was wrong); `403 ForbiddenError` (`DEACTIVATED` account, FR-031a) — message: "This account has been deactivated."

## `POST /api/auth/logout`

**Auth**: any authenticated session. Destroys the session. Response `204`.

## `GET /api/auth/me`

**Auth**: any authenticated session. Returns `{ role, name, username }` for session-restore on page load (e.g., after a refresh). `401` if no valid session.
