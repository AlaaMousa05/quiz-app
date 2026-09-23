import express from "express";
import session from "express-session";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { requireAuth } from "../../src/middleware/requireAuth.middleware";
import { requireRole } from "../../src/middleware/requireRole.middleware";
import { requireOwnership } from "../../src/middleware/requireOwnership.middleware";
import { errorHandlerMiddleware } from "../../src/middleware/errorHandler.middleware";

function buildTestApp() {
  const app = express();
  app.use(express.json());
  app.use(session({ secret: "test", resave: false, saveUninitialized: false }));

  // Test-only login endpoint to seed a session with a given role, standing in
  // for the real POST /api/auth/login so these tests don't depend on a DB.
  app.post("/login-as", (req, res) => {
    req.session.userId = req.body.userId ?? "user-1";
    req.session.role = req.body.role;
    res.status(204).end();
  });

  app.get("/teacher-only", requireAuth, requireRole("TEACHER"), (_req, res) => {
    res.json({ ok: true });
  });

  const quizOwners: Record<string, string | null> = {
    "quiz-owned-by-teacher-1": "teacher-1",
    "quiz-owned-by-teacher-2": "teacher-2",
    "quiz-missing": null,
  };

  app.get(
    "/quizzes/:quizId",
    requireAuth,
    requireOwnership(async (req) => quizOwners[req.params.quizId] ?? null),
    (_req, res) => {
      res.json({ ok: true });
    },
  );

  app.use(errorHandlerMiddleware);
  return app;
}

describe("requireAuth + requireRole", () => {
  it("refuses an unauthenticated request with 401", async () => {
    const app = buildTestApp();
    const res = await request(app).get("/teacher-only");
    expect(res.status).toBe(401);
  });

  it("refuses a STUDENT session on a TEACHER-only route with 403", async () => {
    const app = buildTestApp();
    const agent = request.agent(app);
    await agent.post("/login-as").send({ role: "STUDENT" });

    const res = await agent.get("/teacher-only");
    expect(res.status).toBe(403);
  });

  it("allows a TEACHER session on a TEACHER-only route", async () => {
    const app = buildTestApp();
    const agent = request.agent(app);
    await agent.post("/login-as").send({ role: "TEACHER" });

    const res = await agent.get("/teacher-only");
    expect(res.status).toBe(200);
  });
});

describe("requireOwnership", () => {
  it("allows the owning teacher", async () => {
    const app = buildTestApp();
    const agent = request.agent(app);
    await agent.post("/login-as").send({ userId: "teacher-1", role: "TEACHER" });

    const res = await agent.get("/quizzes/quiz-owned-by-teacher-1");
    expect(res.status).toBe(200);
  });

  it("refuses a TEACHER accessing another teacher's quiz with 403", async () => {
    const app = buildTestApp();
    const agent = request.agent(app);
    await agent.post("/login-as").send({ userId: "teacher-2", role: "TEACHER" });

    const res = await agent.get("/quizzes/quiz-owned-by-teacher-1");
    expect(res.status).toBe(403);
  });

  it("returns 404 when the resource itself doesn't exist", async () => {
    const app = buildTestApp();
    const agent = request.agent(app);
    await agent.post("/login-as").send({ userId: "teacher-1", role: "TEACHER" });

    const res = await agent.get("/quizzes/quiz-missing");
    expect(res.status).toBe(404);
  });
});
