import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/repositories/prismaClient.js";
import { createClass, createStudent, createTeacher, createQuiz, fourOptionQuestion, secondsAgo, secondsFromNow } from "../helpers/attemptFixtures.js";

const app = createApp();

async function loginAs(username: string, password: string) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ username, password });
  expect(res.status).toBe(200);
  return agent;
}

// Core attempt lifecycle against real Postgres: single-attempt enforcement
// (start race + sequential re-start), the conditional-update submit path
// under concurrency, and resume-after-refresh. Deadline/grace-window
// behaviour lives in student-quizzes.deadline.test.ts; ownership/visibility
// lives in student-quizzes.access.test.ts — split to stay under the ~200
// line file guideline (CLAUDE.md).
describe("student-quizzes.routes: lifecycle and concurrency", () => {
  let classA: Awaited<ReturnType<typeof createClass>>;
  let teacher: Awaited<ReturnType<typeof createTeacher>>;

  beforeAll(async () => {
    classA = await createClass("lifecycle-10A");
    teacher = await createTeacher("lifecycle-teacher-1");
  });

  afterAll(async () => {
    await prisma.answer.deleteMany({ where: { attempt: { student: { username: { startsWith: "lifecycle-" } } } } });
    await prisma.attempt.deleteMany({ where: { student: { username: { startsWith: "lifecycle-" } } } });
    await prisma.option.deleteMany({ where: { question: { quiz: { ownerTeacherId: teacher.id } } } });
    await prisma.question.deleteMany({ where: { quiz: { ownerTeacherId: teacher.id } } });
    await prisma.quizClass.deleteMany({ where: { quiz: { ownerTeacherId: teacher.id } } });
    await prisma.quiz.deleteMany({ where: { ownerTeacherId: teacher.id } });
    await prisma.user.deleteMany({ where: { username: { startsWith: "lifecycle-" } } });
    await prisma.class.deleteMany({ where: { id: classA.id } });
    await prisma.$disconnect();
  });

  describe("attempt.spec: duplicate attempt blocked under concurrent/double-submit/two-tab requests", () => {
    it("two parallel start requests for the same student+quiz result in exactly one attempt row", async () => {
      const student = await createStudent({ username: "lifecycle-race-1", classId: classA.id });
      const quiz = await createQuiz({
        ownerTeacherId: teacher.id,
        classIds: [classA.id],
        opensAt: secondsAgo(3600),
        closesAt: secondsFromNow(3600),
        questions: [fourOptionQuestion(10)],
      });
      const agent = await loginAs(student.username, student.password);

      const [r1, r2] = await Promise.all([
        agent.post(`/api/quizzes/${quiz.id}/attempts`),
        agent.post(`/api/quizzes/${quiz.id}/attempts`),
      ]);

      expect([r1.status, r2.status].sort()).toEqual([201, 409]);

      const attempts = await prisma.attempt.findMany({ where: { quizId: quiz.id, studentId: student.id } });
      expect(attempts).toHaveLength(1);
    });
  });

  describe("attempt.spec: second attempt blocked after submission", () => {
    it("start, submit, then start again returns 409 on the second start", async () => {
      const student = await createStudent({ username: "lifecycle-seq-1", classId: classA.id });
      const quiz = await createQuiz({
        ownerTeacherId: teacher.id,
        classIds: [classA.id],
        opensAt: secondsAgo(3600),
        closesAt: secondsFromNow(3600),
        questions: [fourOptionQuestion(10)],
      });
      const agent = await loginAs(student.username, student.password);

      const startRes = await agent.post(`/api/quizzes/${quiz.id}/attempts`);
      expect(startRes.status).toBe(201);

      const submitRes = await agent.post(`/api/attempts/${startRes.body.attemptId}/submit`);
      expect(submitRes.status).toBe(200);

      const secondStartRes = await agent.post(`/api/quizzes/${quiz.id}/attempts`);
      expect(secondStartRes.status).toBe(409);
    });
  });

  describe("two parallel submit requests grade exactly once", () => {
    it("exactly one request performs the transition; the score is computed once and is correct", async () => {
      const student = await createStudent({ username: "lifecycle-race-2", classId: classA.id });
      const quiz = await createQuiz({
        ownerTeacherId: teacher.id,
        classIds: [classA.id],
        opensAt: secondsAgo(3600),
        closesAt: secondsFromNow(3600),
        questions: [fourOptionQuestion(10, 0)], // correct option is index 0 ("A")
      });
      const agent = await loginAs(student.username, student.password);

      const startRes = await agent.post(`/api/quizzes/${quiz.id}/attempts`);
      const attemptId = startRes.body.attemptId;
      const correctOptionId = quiz.questions[0].options[0].id;

      await agent
        .patch(`/api/attempts/${attemptId}/answers`)
        .send({ questionId: quiz.questions[0].id, optionId: correctOptionId });

      const [r1, r2] = await Promise.all([
        agent.post(`/api/attempts/${attemptId}/submit`),
        agent.post(`/api/attempts/${attemptId}/submit`),
      ]);

      expect([r1.status, r2.status].sort()).toEqual([200, 410]);
      const winner = r1.status === 200 ? r1 : r2;
      expect(winner.body.score).toBe(10);

      const attempt = await prisma.attempt.findUniqueOrThrow({ where: { id: attemptId } });
      expect(attempt.status).toBe("SUBMITTED");
      expect(attempt.score?.toNumber()).toBe(10);
      expect(attempt.submittedAt).not.toBeNull();
    });
  });

  describe("attempt.spec: answers autosave and resume with correct remaining time", () => {
    it("a refresh (re-fetching the same in-progress attempt) returns the same deadline and saved answers, not a new attempt", async () => {
      const student = await createStudent({ username: "lifecycle-resume-1", classId: classA.id });
      const quiz = await createQuiz({
        ownerTeacherId: teacher.id,
        classIds: [classA.id],
        opensAt: secondsAgo(3600),
        closesAt: secondsFromNow(3600),
        questions: [fourOptionQuestion(10), fourOptionQuestion(20)],
      });
      const agent = await loginAs(student.username, student.password);

      const startRes = await agent.post(`/api/quizzes/${quiz.id}/attempts`);
      const attemptId = startRes.body.attemptId;
      const chosenOptionId = quiz.questions[0].options[1].id;

      await agent
        .patch(`/api/attempts/${attemptId}/answers`)
        .send({ questionId: quiz.questions[0].id, optionId: chosenOptionId });

      const firstRead = await agent.get(`/api/attempts/${attemptId}`);
      const secondRead = await agent.get(`/api/attempts/${attemptId}`);

      expect(firstRead.status).toBe(200);
      expect(secondRead.body.deadlineAt).toBe(firstRead.body.deadlineAt);
      expect(secondRead.body.answers[quiz.questions[0].id]).toBe(chosenOptionId);

      const attempts = await prisma.attempt.findMany({ where: { quizId: quiz.id, studentId: student.id } });
      expect(attempts).toHaveLength(1);
    });
  });
});
