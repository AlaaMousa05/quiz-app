import type { ClassCreateInput, ClassUpdateInput } from "shared";
import {
  listAllClassesWithCounts,
  findClassById,
  createClass,
  updateClass,
  countClassContents,
  deleteClass,
  listStudentsInClass,
  moveStudent,
} from "../repositories/class.repository.js";
import { ConflictError, NotFoundError } from "../errors/index.js";

export async function list() {
  const classes = await listAllClassesWithCounts();
  return classes.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    studentCount: c._count.students,
    quizCount: c._count.quizzes,
  }));
}

export async function create(input: ClassCreateInput) {
  const created = await createClass(input.name);
  return { classId: created.id };
}

async function requireClass(classId: string) {
  const found = await findClassById(classId);
  if (!found) {
    throw new NotFoundError("Class not found.");
  }
  return found;
}

export async function update(classId: string, input: ClassUpdateInput) {
  await requireClass(classId);
  await updateClass(classId, input);
}

export async function remove(classId: string) {
  await requireClass(classId);
  const { students, quizzes } = await countClassContents(classId);
  if (students > 0 || quizzes > 0) {
    throw new ConflictError("Class has students or quizzes and cannot be deleted — archive it instead.");
  }
  await deleteClass(classId);
}

export async function listStudents(classId: string) {
  await requireClass(classId);
  const students = await listStudentsInClass(classId);
  return students.map((s) => ({ id: s.id, name: s.name, username: s.username }));
}

// Moving a student only ever changes User.classId — an Attempt row is keyed
// on (quizId, studentId) directly, never on the student's class, so past
// attempts are untouched and future quiz visibility follows the new class
// automatically (FR-030).
export async function move(fromClassId: string, studentId: string, toClassId: string) {
  await requireClass(fromClassId);
  await requireClass(toClassId);
  await moveStudent(studentId, toClassId);
}
