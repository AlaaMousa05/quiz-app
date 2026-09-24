import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/repositories/prismaClient.js";
import {
  createClass,
  createStudent,
  createTeacher,
  createQuiz,
  fourOptionQuestion,
  plantAttempt,
  secondsAgo,
  secondsFromNow,
} from "../helpers/attemptFixtures.js";

const app = createApp();

async function loginAs(username: string, password: string) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ username, password });
  expect(res.status).toBe(200);
  return agent;
}

const validSettings = (classId: string) => ({
  title: "New Algebra Quiz",
  classIds: [classId],
  opensAt: secondsFromNow(3600).toISOString(),
  closesAt: secondsFromNow(7200).toISOString(),
  negMarkEnabled: false,
});

const validQuestion = {
  text: "What is 2 + 2?",
  points: 10,
  options: [
    { text: "3", isCorrect: false },
    { text: "4", isCorrect: true },
    { text: "5", isCorrect: false },
    { text: "22", isCorrect: false },
  ],
};

describe("teacher-quizzes.access: ownership, visibility, and lock rules", () => {
  let classA: Awaited<ReturnType<typeof createClass>>;
  let teacher: Awaited<ReturnType<typeof createTeacher>>;
  let otherTeacher: Awaited<ReturnType<typeof createTeacher>>;

  beforeAll(async () => {
    classA = await createClass("teacherquizB-10A");
    teacher = await createTeacher("teacherquizB-teacher-1");
    otherTeacher = await createTeacher("teacherquizB-teacher-2");
  });

  afterAll(async () => {
    await prisma.answer.deleteMany({ where: { attempt: { student: { username: { startsWith: "teacherquizB-" } } } } });
    await prisma.attempt.deleteMany({ where: { student: { username: { startsWith: "teacherquizB-" } } } });
    await prisma.option.deleteMany({ where: { question: { quiz: { ownerTeacherId: { in: [teacher.id, otherTeacher.id] } } } } });
    await prisma.question.deleteMany({ where: { quiz: { ownerTeacherId: { in: [teacher.id, otherTeacher.id] } } } });
    await prisma.quizClass.deleteMany({ where: { quiz: { ownerTeacherId: { in: [teacher.id, otherTeacher.id] } } } });
    await prisma.quiz.deleteMany({ where: { ownerTeacherId: { in: [teacher.id, otherTeacher.id] } } });
    await prisma.user.deleteMany({ where: { username: { startsWith: "teacherquizB-" } } });
    await prisma.class.deleteMany({ where: { id: classA.id } });
    await prisma.$disconnect();
  });

  describe("access.spec: quiz hidden until published", () => {
    it("a draft quiz never appears in the student's quiz list, even for a class it's assigned to", async () => {
      const agent = await loginAs(teacher.username, teacher.password);
      const createRes = await agent.post("/api/teacher/quizzes").send(validSettings(classA.id));
      const { quizId } = createRes.body;

      const student = await createStudent({ username: "teacherquizB-student-1", classId: classA.id });
      const studentAgent = await loginAs(student.username, student.password);
      const listRes = await studentAgent.get("/api/quizzes");

      const allIds = [...listRes.body.open, ...listRes.body.upcoming, ...listRes.body.done].map((q: { id: string }) => q.id);
      expect(allIds).not.toContain(quizId);
    });

    it("a non-owner teacher cannot access another teacher's quiz (403, no existence leak)", async () => {
      const agent = await loginAs(teacher.username, teacher.password);
      const createRes = await agent.post("/api/teacher/quizzes").send(validSettings(classA.id));
      const { quizId } = createRes.body;

      const otherAgent = await loginAs(otherTeacher.username, otherTeacher.password);
      const res = await otherAgent.patch(`/api/teacher/quizzes/${quizId}`).send({ title: "Hijacked" });
      expect(res.status).toBe(403);
    });
  });

  describe("FR-024: quiz locks once an attempt exists", () => {
    it("refuses to change title/questions once an attempt exists, but still allows changing dates", async () => {
      const quiz = await createQuiz({
        ownerTeacherId: teacher.id,
        classIds: [classA.id],
        opensAt: secondsAgo(3600),
        closesAt: secondsFromNow(3600),
        questions: [fourOptionQuestion(10)],
      });
      const student = await createStudent({ username: "teacherquizB-locked-student", classId: classA.id });
      await plantAttempt({ quizId: quiz.id, studentId: student.id, startedAt: secondsAgo(60), deadlineAt: secondsFromNow(600) });

      const agent = await loginAs(teacher.username, teacher.password);

      const titleChange = await agent.patch(`/api/teacher/quizzes/${quiz.id}`).send({ title: "New title" });
      expect(titleChange.status).toBe(409);

      const dateChange = await agent
        .patch(`/api/teacher/quizzes/${quiz.id}`)
        .send({ closesAt: secondsFromNow(10_000).toISOString() });
      expect(dateChange.status).toBe(200);
    });
  });

  describe("FR-004a: unpublish allowed with 0 attempts, refused after", () => {
    it("allows unpublish before any attempt, then blocks it once an attempt exists", async () => {
      const agent = await loginAs(teacher.username, teacher.password);
      const createRes = await agent.post("/api/teacher/quizzes").send(validSettings(classA.id));
      const { quizId } = createRes.body;
      await agent.post(`/api/teacher/quizzes/${quizId}/questions`).send(validQuestion);

      const publishRes = await agent.post(`/api/teacher/quizzes/${quizId}/publish`);
      expect(publishRes.status).toBe(200);

      const unpublishRes = await agent.post(`/api/teacher/quizzes/${quizId}/unpublish`);
      expect(unpublishRes.status).toBe(200);

      await agent.post(`/api/teacher/quizzes/${quizId}/publish`);
      const student = await createStudent({ username: "teacherquizB-unpub-student", classId: classA.id });
      await plantAttempt({ quizId, studentId: student.id, startedAt: secondsAgo(60), deadlineAt: secondsFromNow(600) });

      const blockedUnpublish = await agent.post(`/api/teacher/quizzes/${quizId}/unpublish`);
      expect(blockedUnpublish.status).toBe(409);
    });
  });
});
