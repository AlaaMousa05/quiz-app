import bcrypt from "bcrypt";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/repositories/prismaClient";

const app = createApp();

async function createUser(overrides: {
  username: string;
  password: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  status?: "ACTIVE" | "DEACTIVATED";
}) {
  const passwordHash = await bcrypt.hash(overrides.password, 12);
  return prisma.user.create({
    data: {
      role: overrides.role,
      name: overrides.username,
      nameNormalized: overrides.username.toLowerCase(),
      username: overrides.username,
      passwordHash,
      status: overrides.status ?? "ACTIVE",
    },
  });
}

describe("auth.routes", () => {
  beforeAll(async () => {
    await Promise.all([
      createUser({ username: "auth-student-1", password: "correct-horse", role: "STUDENT" }),
      createUser({
        username: "auth-deactivated-1",
        password: "correct-horse",
        role: "STUDENT",
        status: "DEACTIVATED",
      }),
    ]);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { username: { startsWith: "auth-" } } });
    await prisma.$disconnect();
  });

  it("auth.spec: student can log in with username + password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "auth-student-1", password: "correct-horse" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ role: "STUDENT", name: "auth-student-1", username: "auth-student-1" });

    const cookie = res.headers["set-cookie"];
    expect(cookie).toBeDefined();
    // Not `Secure`: the app container serves plain HTTP (no TLS termination
    // in this deployment), so a Secure cookie would never reach the browser.
    expect(cookie[0]).not.toMatch(/Secure/i);

    const meRes = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(meRes.status).toBe(200);
    expect(meRes.body).toEqual({ role: "STUDENT", name: "auth-student-1", username: "auth-student-1" });
  });

  it("auth.spec: invalid credentials are rejected", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "auth-student-1", password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.messageKey).toBe("auth.invalidCredentials");
  });

  it("auth.spec: unknown username is rejected with the same message as a wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "no-such-user", password: "whatever" });

    expect(res.status).toBe(401);
    expect(res.body.messageKey).toBe("auth.invalidCredentials");
  });

  it("FR-031a: a deactivated user cannot log in", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "auth-deactivated-1", password: "correct-horse" });

    expect(res.status).toBe(403);
    expect(res.body.messageKey).toBe("auth.deactivated");
  });

  it("rejects a login body that fails Zod validation", async () => {
    const res = await request(app).post("/api/auth/login").send({ username: "" });
    expect(res.status).toBe(400);
  });

  it("GET /api/auth/me requires an authenticated session", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("POST /api/auth/logout destroys the session", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({ username: "auth-student-1", password: "correct-horse" });

    const logoutRes = await agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(204);

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(401);
  });
});
