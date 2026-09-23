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

// Deadline/grace-window behaviour against real Postgres. Attempts are
// planted directly via Prisma with a known startedAt/deadlineAt (see
// attemptFixtures.plantAttempt) instead of waiting on real wall-clock time —
// SystemClock is real time in production, but these tests only need a
// correctly-computed relationship between `now` and a stored `deadlineAt`.
describe("student-quizzes.deadline: grace window and open-date range", () => {
  let classA: Awaited<ReturnType<typeof createClass>>;
  let teacher: Awaited<ReturnType<typeof createTeacher>>;

  beforeAll(async () => {
    classA = await createClass("deadline-10A");
    teacher = await createTeacher("deadline-teacher-1");
  });

  afterAll(async () => {
    await prisma.answer.deleteMany({ where: { attempt: { student: { username: { startsWith: "deadline-" } } } } });
    await prisma.attempt.deleteMany({ where: { student: { username: { startsWith: "deadline-" } } } });
    await prisma.option.deleteMany({ where: { question: { quiz: { ownerTeacherId: teacher.id } } } });
    await prisma.question.deleteMany({ where: { quiz: { ownerTeacherId: teacher.id } } });
    await prisma.quizClass.deleteMany({ where: { quiz: { ownerTeacherId: teacher.id } } });
    await prisma.quiz.deleteMany({ where: { ownerTeacherId: teacher.id } });
    await prisma.user.deleteMany({ where: { username: { startsWith: "deadline-" } } });
    await prisma.class.deleteMany({ where: { id: classA.id } });
    await prisma.$disconnect();
  });

  describe("attempt.spec: submission within 10s grace after deadline is accepted", () => {
    it("accepts a save arriving within 10s after the deadline", async () => {
      const student = await createStudent({ username: "deadline-save-ok", classId: classA.id });
      const quiz = await createQuiz({
        ownerTeacherId: teacher.id,
        classIds: [classA.id],
        opensAt: secondsAgo(3600),
        closesAt: secondsFromNow(3600),
        questions: [fourOptionQuestion(10)],
      });
      const attempt = await plantAttempt({
        quizId: quiz.id,
        studentId: student.id,
        startedAt: secondsAgo(1200),
        deadlineAt: secondsAgo(5),
      });
      const agent = await loginAs(student.username, student.password);

      const res = await agent
        .patch(`/api/attempts/${attempt.id}/answers`)
        .send({ questionId: quiz.questions[0].id, optionId: quiz.questions[0].options[0].id });

      expect(res.status).toBe(200);
    });

    it("rejects a save arriving more than 10s after the deadline", async () => {
      const student = await createStudent({ username: "deadline-save-late", classId: classA.id });
      const quiz = await createQuiz({
        ownerTeacherId: teacher.id,
        classIds: [classA.id],
        opensAt: secondsAgo(3600),
        closesAt: secondsFromNow(3600),
        questions: [fourOptionQuestion(10)],
      });
      const attempt = await plantAttempt({
        quizId: quiz.id,
        studentId: student.id,
        startedAt: secondsAgo(1200),
        deadlineAt: secondsAgo(20),
      });
      const agent = await loginAs(student.username, student.password);

      const res = await agent
        .patch(`/api/attempts/${attempt.id}/answers`)
        .send({ questionId: quiz.questions[0].id, optionId: quiz.questions[0].options[0].id });

      expect(res.status).toBe(409);
    });

    it("accepts a submit arriving within 10s after the deadline", async () => {
      const student = await createStudent({ username: "deadline-submit-ok", classId: classA.id });
      const quiz = await createQuiz({
        ownerTeacherId: teacher.id,
        classIds: [classA.id],
        opensAt: secondsAgo(3600),
        closesAt: secondsFromNow(3600),
        questions: [fourOptionQuestion(10)],
      });
      const attempt = await plantAttempt({
        quizId: quiz.id,
        studentId: student.id,
        startedAt: secondsAgo(1200),
        deadlineAt: secondsAgo(5),
      });
      const agent = await loginAs(student.username, student.password);

      const res = await agent.post(`/api/attempts/${attempt.id}/submit`);
      expect(res.status).toBe(200);
    });

    it("rejects a submit arriving more than 10s after the deadline", async () => {
      const student = await createStudent({ username: "deadline-submit-late", classId: classA.id });
      const quiz = await createQuiz({
        ownerTeacherId: teacher.id,
        classIds: [classA.id],
        opensAt: secondsAgo(3600),
        closesAt: secondsFromNow(3600),
        questions: [fourOptionQuestion(10)],
      });
      const attempt = await plantAttempt({
        quizId: quiz.id,
        studentId: student.id,
        startedAt: secondsAgo(1200),
        deadlineAt: secondsAgo(20),
      });
      const agent = await loginAs(student.username, student.password);

      const res = await agent.post(`/api/attempts/${attempt.id}/submit`);
      expect(res.status).toBe(409);
    });
  });

  describe("access.spec: quiz not startable outside its open date range", () => {
    it("rejects starting before opensAt", async () => {
      const student = await createStudent({ username: "deadline-early", classId: classA.id });
      const quiz = await createQuiz({
        ownerTeacherId: teacher.id,
        classIds: [classA.id],
        opensAt: secondsFromNow(3600),
        closesAt: secondsFromNow(7200),
        questions: [fourOptionQuestion(10)],
      });
      const agent = await loginAs(student.username, student.password);

      const res = await agent.post(`/api/quizzes/${quiz.id}/attempts`);
      expect(res.status).toBe(403);
    });

    it("rejects starting after closesAt", async () => {
      const student = await createStudent({ username: "deadline-late", classId: classA.id });
      const quiz = await createQuiz({
        ownerTeacherId: teacher.id,
        classIds: [classA.id],
        opensAt: secondsAgo(7200),
        closesAt: secondsAgo(3600),
        questions: [fourOptionQuestion(10)],
      });
      const agent = await loginAs(student.username, student.password);

      const res = await agent.post(`/api/quizzes/${quiz.id}/attempts`);
      expect(res.status).toBe(403);
    });

    it("the 10s grace never lets a new attempt start after closesAt", async () => {
      const student = await createStudent({ username: "deadline-grace-start", classId: classA.id });
      const quiz = await createQuiz({
        ownerTeacherId: teacher.id,
        classIds: [classA.id],
        opensAt: secondsAgo(3600),
        closesAt: secondsAgo(5), // 5s past close — inside what would be the 10s grace for save/submit
        questions: [fourOptionQuestion(10)],
      });
      const agent = await loginAs(student.username, student.password);

      const res = await agent.post(`/api/quizzes/${quiz.id}/attempts`);
      expect(res.status).toBe(403);

      const attempts = await prisma.attempt.findMany({ where: { quizId: quiz.id, studentId: student.id } });
      expect(attempts).toHaveLength(0);
    });
  });
});
