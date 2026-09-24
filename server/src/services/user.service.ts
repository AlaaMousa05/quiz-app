import bcrypt from "bcrypt";
import type { UserCreateInput } from "shared";
import {
  listAllUsers,
  findById,
  createUser,
  updatePasswordHash,
  setUserStatus,
  destroySessionsForUser,
} from "../repositories/user.repository.js";
import { findClassById } from "../repositories/class.repository.js";
import { generateStudentUsername, generateTeacherUsername, generateTemporaryPassword } from "./credentials.service.js";
import { NotFoundError, ValidationError } from "../errors/index.js";

export async function list() {
  const users = await listAllUsers();
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    role: u.role,
    className: u.class?.name,
    status: u.status,
  }));
}

export async function create(input: UserCreateInput) {
  let username: string;
  if (input.role === "STUDENT") {
    // Schema-level refine already guarantees classId is present for STUDENT.
    const klass = await findClassById(input.classId!);
    if (!klass) {
      throw new ValidationError("classId does not refer to an existing class.");
    }
    username = await generateStudentUsername(klass.name);
  } else {
    username = await generateTeacherUsername(input.name);
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const user = await createUser({ role: input.role, name: input.name, username, passwordHash, classId: input.classId });

  return { userId: user.id, username: user.username, temporaryPassword };
}

async function requireUser(userId: string) {
  const user = await findById(userId);
  if (!user) {
    throw new NotFoundError("User not found.");
  }
  return user;
}

export async function resetPassword(userId: string) {
  await requireUser(userId);
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  await updatePasswordHash(userId, passwordHash);
  return { temporaryPassword };
}

export async function deactivate(userId: string) {
  await requireUser(userId);
  await setUserStatus(userId, "DEACTIVATED");
  await destroySessionsForUser(userId);
}

export async function reactivate(userId: string) {
  await requireUser(userId);
  await setUserStatus(userId, "ACTIVE");
}
