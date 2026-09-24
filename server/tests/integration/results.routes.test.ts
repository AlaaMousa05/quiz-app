import request from "supertest";
import bcrypt from "bcrypt";
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
  saveAnswerDirect,
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

async function createAdmin(username: string, password = "correct-horse") {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { role: "ADMIN", name: username, nameNormalized: username.toLowerCase(), username, passwordHash },
  });
  return { ...user, password };
}

describe("results.routes", () => {
  let classA: Awaited<ReturnType<typeof createClass>>;
  let teacher: Awaited<ReturnType<typeof createTeacher>>;
  let otherTeacher: Awaited<ReturnType<typeof createTeacher>>;
  let admin: Awaited<ReturnType<typeof createAdmin>>;
  let quiz: Awaited<ReturnType<typeof createQuiz>>;
  let submittedStudent: Awaited<ReturnType<typeof createStudent>>;
  let notStartedStudent: Awaited<ReturnType<typeof createStudent>>;
  let inProgressStudent: Awaited<ReturnType<typeof createStudent>>;

  beforeAll(async () => {
    classA = await createClass("results-10A");
    teacher = await createTeacher("results-teacher-1");
    otherTeacher = await createTeacher("results-teacher-2");
    admin = await createAdmin("results-admin-1");
    quiz = await createQuiz({
      ownerTeacherId: teacher.id,
      classIds: [classA.id],
      opensAt: secondsAgo(3600),
      closesAt: secondsFromNow(3600),
      questions: [fourOptionQuestion(10, 0)],
    });

    submittedStudent = await createStudent({ username: "results-submitted", classId: classA.id });
    notStartedStudent = await createStudent({ username: "results-notstarted", classId: classA.id });
    inProgressStudent = await createStudent({ username: "results-inprogress", classId: classA.id });

    const submittedAttempt = await plantAttempt({
      quizId: quiz.id,
      studentId: submittedStudent.id,
      startedAt: secondsAgo(600),
      deadlineAt: secondsFromNow(600),
      status: "SUBMITTED",
      score: 10,
      submittedAt: secondsAgo(500),
    });
    await saveAnswerDirect(submittedAttempt.id, quiz.questions[0]!.id, quiz.questions[0]!.options[0]!.id);

    await plantAttempt({
      quizId: quiz.id,
      studentId: inProgressStudent.id,
      startedAt: secondsAgo(60),
      deadlineAt: secondsFromNow(600),
    });
  });

  afterAll(async () => {
    await prisma.answer.deleteMany({ where: { attempt: { student: { username: { startsWith: "results-" } } } } });
    await prisma.attempt.deleteMany({ where: { student: { username: { startsWith: "results-" } } } });
    await prisma.option.deleteMany({ where: { question: { quiz: { ownerTeacherId: teacher.id } } } });
    await prisma.question.deleteMany({ where: { quiz: { ownerTeacherId: teacher.id } } });
    await prisma.quizClass.deleteMany({ where: { quiz: { ownerTeacherId: teacher.id } } });
    await prisma.quiz.deleteMany({ where: { ownerTeacherId: teacher.id } });
    await prisma.user.deleteMany({ where: { username: { startsWith: "results-" } } });
    await prisma.class.deleteMany({ where: { id: classA.id } });
    await prisma.$disconnect();
  });

  describe("results.spec: teacher sees results for own quiz", () => {
    it("returns class average, per-question %, and per-student status/score", async () => {
      const agent = await loginAs(teacher.username, teacher.password);
      const res = await agent.get(`/api/teacher/quizzes/${quiz.id}/results`);

      expect(res.status).toBe(200);
      expect(res.body.maxPoints).toBe(10);
      expect(res.body.classAverage).toBe(10);
      expect(res.body.perQuestionPctCorrect).toEqual([{ questionId: quiz.questions[0]!.id, pctCorrect: 100 }]);

      const byUsername = Object.fromEntries(res.body.students.map((s: { name: string }) => [s.name, s]));
      expect(byUsername[submittedStudent.username]).toMatchObject({ status: "SUBMITTED", score: 10 });
      expect(byUsername[notStartedStudent.username]).toMatchObject({ status: "NOT_STARTED" });
      expect(byUsername[inProgressStudent.username]).toMatchObject({ status: "IN_PROGRESS" });
    });

    it("denies a non-owner teacher (403, no existence leak)", async () => {
      const agent = await loginAs(otherTeacher.username, otherTeacher.password);
      const res = await agent.get(`/api/teacher/quizzes/${quiz.id}/results`);
      expect(res.status).toBe(403);
    });
  });

  describe("results.spec: admin sees results for any quiz", () => {
    it("returns the same shape as the teacher endpoint, without an ownership check", async () => {
      const agent = await loginAs(admin.username, admin.password);
      const res = await agent.get(`/api/admin/quizzes/${quiz.id}/results`);

      expect(res.status).toBe(200);
      expect(res.body.classAverage).toBe(10);
      expect(res.body.students).toHaveLength(3);
    });
  });

  describe("results.spec: CSV export matches on-screen data", () => {
    it("exports the same student rows and class average as the JSON results", async () => {
      const agent = await loginAs(teacher.username, teacher.password);
      const res = await agent.get(`/api/teacher/quizzes/${quiz.id}/results/export.csv`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/text\/csv/);
      expect(res.text).toContain(submittedStudent.username);
      expect(res.text).toContain("10");
      expect(res.text).toContain(notStartedStudent.username);
      expect(res.text).toContain("NOT_STARTED");
    });
  });
});
