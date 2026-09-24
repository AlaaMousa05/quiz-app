import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/repositories/prismaClient.js";
import { createClass, createTeacher, secondsFromNow } from "../helpers/attemptFixtures.js";

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

describe("teacher-quizzes.routes: creation and question validation", () => {
  let classA: Awaited<ReturnType<typeof createClass>>;
  let teacher: Awaited<ReturnType<typeof createTeacher>>;

  beforeAll(async () => {
    classA = await createClass("teacherquizA-10A");
    teacher = await createTeacher("teacherquizA-teacher-1");
  });

  afterAll(async () => {
    await prisma.option.deleteMany({ where: { question: { quiz: { ownerTeacherId: teacher.id } } } });
    await prisma.question.deleteMany({ where: { quiz: { ownerTeacherId: teacher.id } } });
    await prisma.quizClass.deleteMany({ where: { quiz: { ownerTeacherId: teacher.id } } });
    await prisma.quiz.deleteMany({ where: { ownerTeacherId: teacher.id } });
    await prisma.user.deleteMany({ where: { username: { startsWith: "teacherquizA-" } } });
    await prisma.class.deleteMany({ where: { id: classA.id } });
    await prisma.$disconnect();
  });

  describe("quiz-builder.spec: teacher can create a quiz with questions, options, and points", () => {
    it("creates a draft quiz, then adds a question with 4 options and points", async () => {
      const agent = await loginAs(teacher.username, teacher.password);

      const createRes = await agent.post("/api/teacher/quizzes").send(validSettings(classA.id));
      expect(createRes.status).toBe(201);
      const { quizId } = createRes.body;

      const questionRes = await agent.post(`/api/teacher/quizzes/${quizId}/questions`).send(validQuestion);
      expect(questionRes.status).toBe(201);

      const saved = await prisma.quiz.findUniqueOrThrow({
        where: { id: quizId },
        include: { questions: { include: { options: true } } },
      });
      expect(saved.status).toBe("DRAFT");
      expect(saved.questions).toHaveLength(1);
      expect(saved.questions[0]?.options).toHaveLength(4);
      expect(saved.questions[0]?.points.toNumber()).toBe(10);
    });
  });

  describe("quiz-builder.spec: question requires exactly 4 options, 1 correct answer, and a point value", () => {
    it("rejects a question with only 3 options", async () => {
      const agent = await loginAs(teacher.username, teacher.password);
      const createRes = await agent.post("/api/teacher/quizzes").send(validSettings(classA.id));
      const { quizId } = createRes.body;

      const res = await agent
        .post(`/api/teacher/quizzes/${quizId}/questions`)
        .send({ ...validQuestion, options: validQuestion.options.slice(0, 3) });
      expect(res.status).toBe(400);
    });

    it("rejects a question with two correct options", async () => {
      const agent = await loginAs(teacher.username, teacher.password);
      const createRes = await agent.post("/api/teacher/quizzes").send(validSettings(classA.id));
      const { quizId } = createRes.body;

      const twoCorrect = validQuestion.options.map((o, i) => ({ ...o, isCorrect: i < 2 }));
      const res = await agent.post(`/api/teacher/quizzes/${quizId}/questions`).send({ ...validQuestion, options: twoCorrect });
      expect(res.status).toBe(400);
    });

    it("rejects a question with no point value", async () => {
      const agent = await loginAs(teacher.username, teacher.password);
      const createRes = await agent.post("/api/teacher/quizzes").send(validSettings(classA.id));
      const { quizId } = createRes.body;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured only to omit `points`
      const { points: _points, ...withoutPoints } = validQuestion;
      const res = await agent.post(`/api/teacher/quizzes/${quizId}/questions`).send(withoutPoints);
      expect(res.status).toBe(400);
    });
  });

  describe("quiz-builder.spec: time limit defaults to 20 minutes if unset", () => {
    it("defaults timeLimitMinutes to 20 when the field is omitted", async () => {
      const agent = await loginAs(teacher.username, teacher.password);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured only to omit `timeLimitMinutes`
      const { timeLimitMinutes: _unused, ...withoutTimeLimit } = validSettings(classA.id);
      const res = await agent.post("/api/teacher/quizzes").send(withoutTimeLimit);
      expect(res.status).toBe(201);

      const saved = await prisma.quiz.findUniqueOrThrow({ where: { id: res.body.quizId } });
      expect(saved.timeLimitMinutes).toBe(20);
    });
  });

  describe("FR-023: cannot publish a quiz with zero questions", () => {
    it("rejects publish when the quiz has no questions yet", async () => {
      const agent = await loginAs(teacher.username, teacher.password);
      const createRes = await agent.post("/api/teacher/quizzes").send(validSettings(classA.id));
      const res = await agent.post(`/api/teacher/quizzes/${createRes.body.quizId}/publish`);
      expect(res.status).toBe(400);
    });
  });
});
