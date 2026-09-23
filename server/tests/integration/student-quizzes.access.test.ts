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

// Ownership/visibility and tamper rejection against real Postgres. Every
// "wrong class" / "wrong student" case must come back 403 or 404 without
// otherwise distinguishing "exists but not yours" from "doesn't exist"
// (FR-006, contracts/student-quizzes.md).
describe("student-quizzes.access: cross-class, cross-student, and tamper rejection", () => {
  let classA: Awaited<ReturnType<typeof createClass>>;
  let classB: Awaited<ReturnType<typeof createClass>>;
  let teacher: Awaited<ReturnType<typeof createTeacher>>;

  beforeAll(async () => {
    classA = await createClass("access-10A");
    classB = await createClass("access-10B");
    teacher = await createTeacher("access-teacher-1");
  });

  afterAll(async () => {
    await prisma.answer.deleteMany({ where: { attempt: { student: { username: { startsWith: "access-" } } } } });
    await prisma.attempt.deleteMany({ where: { student: { username: { startsWith: "access-" } } } });
    await prisma.option.deleteMany({ where: { question: { quiz: { ownerTeacherId: teacher.id } } } });
    await prisma.question.deleteMany({ where: { quiz: { ownerTeacherId: teacher.id } } });
    await prisma.quizClass.deleteMany({ where: { quiz: { ownerTeacherId: teacher.id } } });
    await prisma.quiz.deleteMany({ where: { ownerTeacherId: teacher.id } });
    await prisma.user.deleteMany({ where: { username: { startsWith: "access-" } } });
    await prisma.class.deleteMany({ where: { id: { in: [classA.id, classB.id] } } });
    await prisma.$disconnect();
  });

  it("a student from class 10A cannot start an attempt for a quiz assigned only to 10B (404, not 403 — no existence leak)", async () => {
    const student = await createStudent({ username: "access-crossclass-start", classId: classA.id });
    const quiz = await createQuiz({
      ownerTeacherId: teacher.id,
      classIds: [classB.id],
      opensAt: secondsAgo(3600),
      closesAt: secondsFromNow(3600),
      questions: [fourOptionQuestion(10)],
    });
    const agent = await loginAs(student.username, student.password);

    const res = await agent.post(`/api/quizzes/${quiz.id}/attempts`);
    expect(res.status).toBe(404);
  });

  it("a student from class 10A cannot read the quiz intro for a quiz assigned only to 10B", async () => {
    const student = await createStudent({ username: "access-crossclass-read", classId: classA.id });
    const quiz = await createQuiz({
      ownerTeacherId: teacher.id,
      classIds: [classB.id],
      opensAt: secondsAgo(3600),
      closesAt: secondsFromNow(3600),
      questions: [fourOptionQuestion(10)],
    });
    const agent = await loginAs(student.username, student.password);

    const res = await agent.get(`/api/quizzes/${quiz.id}`);
    expect(res.status).toBe(404);
  });

  it("a student cannot read another student's attempt for the same quiz", async () => {
    const owner = await createStudent({ username: "access-owner-1", classId: classA.id });
    const intruder = await createStudent({ username: "access-intruder-1", classId: classA.id });
    const quiz = await createQuiz({
      ownerTeacherId: teacher.id,
      classIds: [classA.id],
      opensAt: secondsAgo(3600),
      closesAt: secondsFromNow(3600),
      questions: [fourOptionQuestion(10)],
    });
    const ownerAgent = await loginAs(owner.username, owner.password);
    const startRes = await ownerAgent.post(`/api/quizzes/${quiz.id}/attempts`);
    const attemptId = startRes.body.attemptId;

    const intruderAgent = await loginAs(intruder.username, intruder.password);
    const res = await intruderAgent.get(`/api/attempts/${attemptId}`);
    expect([403, 404]).toContain(res.status);
  });

  it("a student cannot modify (autosave) another student's attempt", async () => {
    const owner = await createStudent({ username: "access-owner-2", classId: classA.id });
    const intruder = await createStudent({ username: "access-intruder-2", classId: classA.id });
    const quiz = await createQuiz({
      ownerTeacherId: teacher.id,
      classIds: [classA.id],
      opensAt: secondsAgo(3600),
      closesAt: secondsFromNow(3600),
      questions: [fourOptionQuestion(10)],
    });
    const ownerAgent = await loginAs(owner.username, owner.password);
    const startRes = await ownerAgent.post(`/api/quizzes/${quiz.id}/attempts`);
    const attemptId = startRes.body.attemptId;

    const intruderAgent = await loginAs(intruder.username, intruder.password);
    const res = await intruderAgent
      .patch(`/api/attempts/${attemptId}/answers`)
      .send({ questionId: quiz.questions[0].id, optionId: quiz.questions[0].options[0].id });
    expect([403, 404]).toContain(res.status);
  });

  it("a student cannot submit another student's attempt", async () => {
    const owner = await createStudent({ username: "access-owner-3", classId: classA.id });
    const intruder = await createStudent({ username: "access-intruder-3", classId: classA.id });
    const quiz = await createQuiz({
      ownerTeacherId: teacher.id,
      classIds: [classA.id],
      opensAt: secondsAgo(3600),
      closesAt: secondsFromNow(3600),
      questions: [fourOptionQuestion(10)],
    });
    const ownerAgent = await loginAs(owner.username, owner.password);
    const startRes = await ownerAgent.post(`/api/quizzes/${quiz.id}/attempts`);
    const attemptId = startRes.body.attemptId;

    const intruderAgent = await loginAs(intruder.username, intruder.password);
    const res = await intruderAgent.post(`/api/attempts/${attemptId}/submit`);
    expect([403, 404]).toContain(res.status);
  });

  it("rejects an optionId that doesn't belong to the given question", async () => {
    const student = await createStudent({ username: "access-tamper-1", classId: classA.id });
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

    const foreignOptionId = quiz.questions[1].options[0].id; // belongs to question 2, not question 1
    const res = await agent
      .patch(`/api/attempts/${attemptId}/answers`)
      .send({ questionId: quiz.questions[0].id, optionId: foreignOptionId });

    expect(res.status).toBe(400);
  });

  describe("scoring.spec: correctness never revealed before submission", () => {
    it("the in-progress attempt response never includes any field revealing which option is correct", async () => {
      const student = await createStudent({ username: "access-hide-correct", classId: classA.id });
      const quiz = await createQuiz({
        ownerTeacherId: teacher.id,
        classIds: [classA.id],
        opensAt: secondsAgo(3600),
        closesAt: secondsFromNow(3600),
        questions: [fourOptionQuestion(10)],
      });
      const agent = await loginAs(student.username, student.password);
      const startRes = await agent.post(`/api/quizzes/${quiz.id}/attempts`);
      const attemptId = startRes.body.attemptId;

      const res = await agent.get(`/api/attempts/${attemptId}`);
      expect(res.status).toBe(200);

      const serialized = JSON.stringify(res.body);
      expect(serialized).not.toMatch(/isCorrect/i);
      expect(serialized).not.toMatch(/correctOptionId/i);
    });
  });
});
