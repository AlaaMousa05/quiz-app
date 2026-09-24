import { normalizeArabicName } from "shared";
import { prisma } from "./prismaClient.js";

export function findByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
}

export function findById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function findDuplicateStudent(nameNormalized: string, className: string) {
  return prisma.user.findFirst({ where: { role: "STUDENT", nameNormalized, class: { name: className } } });
}

export function findDuplicateTeacher(nameNormalized: string) {
  return prisma.user.findFirst({ where: { role: "TEACHER", nameNormalized } });
}

export function listAllUsers() {
  return prisma.user.findMany({ include: { class: true }, orderBy: { name: "asc" } });
}

export interface CreateUserData {
  role: "TEACHER" | "STUDENT";
  name: string;
  username: string;
  passwordHash: string;
  classId?: string;
}

// `nameNormalized` is computed at every write site (here, and by
// import.service.ts's bulk path) — never left for a caller to forget,
// per research.md's FR-038 decision.
export function createUser(data: CreateUserData) {
  return prisma.user.create({
    data: {
      role: data.role,
      name: data.name,
      nameNormalized: normalizeArabicName(data.name),
      username: data.username,
      passwordHash: data.passwordHash,
      classId: data.classId,
    },
  });
}

export function updatePasswordHash(userId: string, passwordHash: string) {
  return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export function setUserStatus(userId: string, status: "ACTIVE" | "DEACTIVATED") {
  return prisma.user.update({ where: { id: userId }, data: { status } });
}

// connect-pg-simple manages the `session` table directly (it's not a Prisma
// model — session.middleware.ts), storing session data as a JSON `sess`
// column. Deactivating a user must kill any already-authenticated session
// immediately (contracts/admin-users.md) rather than waiting for it to
// naturally expire, which is exactly why sessions are server-stored at all.
export function destroySessionsForUser(userId: string) {
  return prisma.$executeRaw`DELETE FROM "session" WHERE sess->>'userId' = ${userId}`;
}
