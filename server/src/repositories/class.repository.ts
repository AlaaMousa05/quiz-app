import { prisma } from "./prismaClient.js";

export function listActiveClasses() {
  return prisma.class.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
}

export function listAllClassesWithCounts() {
  return prisma.class.findMany({
    include: { _count: { select: { students: true, quizzes: true } } },
    orderBy: { name: "asc" },
  });
}

export function findClassById(classId: string) {
  return prisma.class.findUnique({ where: { id: classId } });
}

export function findClassByName(name: string) {
  return prisma.class.findUnique({ where: { name } });
}

export function listAllClassNames() {
  return prisma.class.findMany({ select: { name: true } });
}

export function createClass(name: string) {
  return prisma.class.create({ data: { name } });
}

export function updateClass(classId: string, data: { name?: string; status?: "ACTIVE" | "ARCHIVED" }) {
  return prisma.class.update({ where: { id: classId }, data });
}

export async function countClassContents(classId: string): Promise<{ students: number; quizzes: number }> {
  const [students, quizzes] = await Promise.all([
    prisma.user.count({ where: { classId } }),
    prisma.quizClass.count({ where: { classId } }),
  ]);
  return { students, quizzes };
}

export function deleteClass(classId: string) {
  return prisma.class.delete({ where: { id: classId } });
}

export function listStudentsInClass(classId: string) {
  return prisma.user.findMany({ where: { classId, role: "STUDENT" }, orderBy: { name: "asc" } });
}

export function moveStudent(studentId: string, toClassId: string) {
  return prisma.user.update({ where: { id: studentId }, data: { classId: toClassId } });
}
