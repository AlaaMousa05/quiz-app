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

// Lazy finalization (FR-009): an attempt that ran out the clock without an
// explicit submit is scored the first time anything reads it after the
// deadline + grace period, not by a separate background sweep endpoint.
describe("student-quizzes.finalize: lazy finalization on read", () => {
  let classA: Awaited<ReturnType<typeof createClass>>;
  let teacher: Awaited<ReturnType<typeof createTeacher>>;

  beforeAll(async () => {
    classA = await createClass("finalize-10A");
    teacher = await createTeacher("finalize-teacher-1");
  });

  afterAll(async () => {
    await prisma.answer.deleteMany({ where: { attempt: { student: { username: { startsWith: "finalize-" } } } } });
    await prisma.attempt.deleteMany({ where: { student: { username: { startsWith: "finalize-" } } } });
    await prisma.option.deleteMany({ where: { question: { quiz: { ownerTeacherId: teacher.id } } } });
    await prisma.question.deleteMany({ where: { quiz: { ownerTeacherId: teacher.id } } });
    await prisma.quizClass.deleteMany({ where: { quiz: { ownerTeacherId: teacher.id } } });
    await prisma.quiz.deleteMany({ where: { ownerTeacherId: teacher.id } });
    await prisma.user.deleteMany({ where: { username: { startsWith: "finalize-" } } });
    await prisma.class.deleteMany({ where: { id: classA.id } });
    await prisma.$disconnect();
  });

  it("is graded correctly the first time it's read after the deadline", async () => {
    const student = await createStudent({ username: "finalize-lazy-1", classId: classA.id });
    const quiz = await createQuiz({
      ownerTeacherId: teacher.id,
      classIds: [classA.id],
      opensAt: secondsAgo(3600),
      closesAt: secondsFromNow(3600),
      negMarkEnabled: true,
      negMarkPenalty: 0.25,
      questions: [fourOptionQuestion(10, 0), fourOptionQuestion(20, 1)],
    });
    const attempt = await plantAttempt({
      quizId: quiz.id,
      studentId: student.id,
      startedAt: secondsAgo(1300),
      deadlineAt: secondsAgo(30), // well past the 10s grace
    });
    // Q1 answered correctly (+10), Q2 answered wrong (-(0.25*20) = -5) -> 5
    await saveAnswerDirect(attempt.id, quiz.questions[0].id, quiz.questions[0].options[0].id);
    await saveAnswerDirect(attempt.id, quiz.questions[1].id, quiz.questions[1].options[0].id);

    const agent = await loginAs(student.username, student.password);
    const res = await agent.get(`/api/attempts/${attempt.id}/result`);

    expect(res.status).toBe(200);
    expect(res.body.score).toBe(5);

    const finalized = await prisma.attempt.findUniqueOrThrow({ where: { id: attempt.id } });
    expect(finalized.status).toBe("AUTO_FINALIZED");
    expect(finalized.score?.toNumber()).toBe(5);
  });

  it("PATCHing the same answer twice in a row upserts rather than duplicating the row", async () => {
    const student = await createStudent({ username: "finalize-double-save", classId: classA.id });
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
      startedAt: secondsAgo(60),
      deadlineAt: secondsFromNow(1200),
    });
    const agent = await loginAs(student.username, student.password);
    const body = { questionId: quiz.questions[0].id, optionId: quiz.questions[0].options[0].id };

    const first = await agent.patch(`/api/attempts/${attempt.id}/answers`).send(body);
    const second = await agent.patch(`/api/attempts/${attempt.id}/answers`).send(body);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const answers = await prisma.answer.findMany({ where: { attemptId: attempt.id, questionId: body.questionId } });
    expect(answers).toHaveLength(1);
  });

  it("submitting an attempt that is already AUTO_FINALIZED returns the same already-finalized response as a SUBMITTED attempt", async () => {
    const student = await createStudent({ username: "finalize-resubmit", classId: classA.id });
    const quiz = await createQuiz({
      ownerTeacherId: teacher.id,
      classIds: [classA.id],
      opensAt: secondsAgo(3600),
      closesAt: secondsFromNow(3600),
      questions: [fourOptionQuestion(10)],
    });
    const deadlineAt = secondsAgo(30);
    const attempt = await plantAttempt({
      quizId: quiz.id,
      studentId: student.id,
      startedAt: secondsAgo(1300),
      deadlineAt,
      status: "AUTO_FINALIZED", // already finalized by an earlier lazy read; never explicitly submitted
      score: 10,
      submittedAt: deadlineAt,
    });
    const agent = await loginAs(student.username, student.password);

    const res = await agent.post(`/api/attempts/${attempt.id}/submit`);

    expect(res.status).toBe(410);

    const unchanged = await prisma.attempt.findUniqueOrThrow({ where: { id: attempt.id } });
    expect(unchanged.status).toBe("AUTO_FINALIZED");
    expect(unchanged.score?.toNumber()).toBe(10);
    expect(unchanged.submittedAt?.toISOString()).toBe(deadlineAt.toISOString());
  });

  it("reviewing within a still-IN_PROGRESS attempt's own grace window after closesAt returns 403, not a stray 409", async () => {
    const student = await createStudent({ username: "finalize-review-grace", classId: classA.id });
    const closesAt = secondsAgo(3); // quiz closed 3s ago
    const quiz = await createQuiz({
      ownerTeacherId: teacher.id,
      classIds: [classA.id],
      opensAt: secondsAgo(3600),
      closesAt,
      questions: [fourOptionQuestion(10)],
    });
    // deadlineAt === closesAt (time limit didn't bind) and still within the
    // 10s grace, so this attempt could still be legitimately submitted.
    const attempt = await plantAttempt({
      quizId: quiz.id,
      studentId: student.id,
      startedAt: secondsAgo(60),
      deadlineAt: closesAt,
    });
    const agent = await loginAs(student.username, student.password);

    const res = await agent.get(`/api/attempts/${attempt.id}/review`);

    expect(res.status).toBe(403);
    const untouched = await prisma.attempt.findUniqueOrThrow({ where: { id: attempt.id } });
    expect(untouched.status).toBe("IN_PROGRESS");
  });

  it("reviewing after the grace window has fully elapsed finalizes and reveals the breakdown", async () => {
    const student = await createStudent({ username: "finalize-review-ready", classId: classA.id });
    const closesAt = secondsAgo(30); // well past the 10s grace
    const quiz = await createQuiz({
      ownerTeacherId: teacher.id,
      classIds: [classA.id],
      opensAt: secondsAgo(3600),
      closesAt,
      questions: [fourOptionQuestion(10, 0)],
    });
    const attempt = await plantAttempt({
      quizId: quiz.id,
      studentId: student.id,
      startedAt: secondsAgo(1300),
      deadlineAt: closesAt,
    });
    await saveAnswerDirect(attempt.id, quiz.questions[0].id, quiz.questions[0].options[0].id);

    const agent = await loginAs(student.username, student.password);
    const res = await agent.get(`/api/attempts/${attempt.id}/review`);

    expect(res.status).toBe(200);
    expect(res.body.score).toBe(10);
    expect(res.body.questions[0].correctOptionId).toBe(quiz.questions[0].options[0].id);

    const finalized = await prisma.attempt.findUniqueOrThrow({ where: { id: attempt.id } });
    expect(finalized.status).toBe("AUTO_FINALIZED");
  });
});
