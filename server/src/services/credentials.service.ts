import { randomBytes } from "node:crypto";
import { findByUsername } from "../repositories/user.repository.js";

// Excludes visually-ambiguous characters (0/O, 1/I/l) — these are shown once
// on a printed page (FR-031b) and typed back in by hand.
const PASSWORD_CHARS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateTemporaryPassword(): string {
  const bytes = randomBytes(6);
  const chars = Array.from(bytes, (b) => PASSWORD_CHARS[b % PASSWORD_CHARS.length]);
  return `${chars.slice(0, 3).join("")}-${chars.slice(3, 6).join("")}`;
}

async function firstAvailable(candidates: Generator<string>): Promise<string> {
  for (const candidate of candidates) {
    // eslint-disable-next-line no-await-in-loop -- sequential by design: each candidate depends on the previous one not existing
    if (!(await findByUsername(candidate))) {
      return candidate;
    }
  }
  throw new Error("Could not generate a unique username.");
}

function* studentUsernameCandidates(className: string): Generator<string> {
  const safeClassName = className.replace(/[^A-Za-z0-9]/g, "");
  for (let n = 1; n <= 999; n++) {
    yield `S${safeClassName}${String(n).padStart(2, "0")}`;
  }
}

export function generateStudentUsername(className: string): Promise<string> {
  return firstAvailable(studentUsernameCandidates(className));
}

function* teacherUsernameCandidates(name: string): Generator<string> {
  const base = `t-${(name.trim().split(/\s+/)[0] ?? "user").toLowerCase().replace(/[^a-z]/g, "") || "user"}`;
  yield base;
  for (let n = 1; n <= 999; n++) {
    yield `${base}${n}`;
  }
}

export function generateTeacherUsername(name: string): Promise<string> {
  return firstAvailable(teacherUsernameCandidates(name));
}
