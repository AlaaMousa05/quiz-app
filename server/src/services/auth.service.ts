import bcrypt from "bcrypt";
import type { Role } from "shared";
import { findByUsername } from "../repositories/user.repository.js";
import { ForbiddenError, UnauthorizedError } from "../errors/index.js";

export interface AuthenticatedUser {
  id: string;
  role: Role;
  name: string;
  username: string;
}

// Not a real user's hash — only exists so bcrypt.compare always runs the same
// cost-12 work, whether or not the username exists. Without this, a missing
// user returns 401 near-instantly while a wrong password takes ~100ms,
// letting an attacker enumerate valid usernames by response time alone.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("no-such-user-timing-guard", 12);

export async function login(username: string, password: string): Promise<AuthenticatedUser> {
  const user = await findByUsername(username);
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

  if (!user || !passwordMatches) {
    throw new UnauthorizedError("Incorrect username or password.", "auth.invalidCredentials");
  }

  if (user.status === "DEACTIVATED") {
    throw new ForbiddenError("This account has been deactivated.", "auth.deactivated");
  }

  return { id: user.id, role: user.role as Role, name: user.name, username: user.username };
}
