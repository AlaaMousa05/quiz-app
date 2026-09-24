import request from "supertest";
import bcrypt from "bcrypt";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/repositories/prismaClient.js";

const app = createApp();

async function createAdmin(username: string, password = "correct-horse") {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { role: "ADMIN", name: username, nameNormalized: username.toLowerCase(), username, passwordHash },
  });
  return { ...user, password };
}

async function loginAs(username: string, password: string) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ username, password });
  expect(res.status).toBe(200);
  return agent;
}

describe("admin-classes.routes", () => {
  let admin: Awaited<ReturnType<typeof createAdmin>>;

  beforeAll(async () => {
    admin = await createAdmin("adminclass-admin-1");
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { username: { startsWith: "adminclass-" } } });
    await prisma.class.deleteMany({ where: { name: { startsWith: "adminclass-" } } });
    await prisma.$disconnect();
  });

  describe("admin.spec: create/rename/archive a class", () => {
    it("creates, renames, and archives a class", async () => {
      const agent = await loginAs(admin.username, admin.password);

      const createRes = await agent.post("/api/admin/classes").send({ name: "adminclass-10Z" });
      expect(createRes.status).toBe(201);
      const { classId } = createRes.body;

      const renameRes = await agent.patch(`/api/admin/classes/${classId}`).send({ name: "adminclass-10Z-renamed" });
      expect(renameRes.status).toBe(200);

      const archiveRes = await agent.patch(`/api/admin/classes/${classId}`).send({ status: "ARCHIVED" });
      expect(archiveRes.status).toBe(200);

      const listRes = await agent.get("/api/admin/classes");
      const found = listRes.body.find((c: { id: string }) => c.id === classId);
      expect(found).toMatchObject({ name: "adminclass-10Z-renamed", status: "ARCHIVED" });
    });

    it("restores an archived class back to active (FR-028/029)", async () => {
      const agent = await loginAs(admin.username, admin.password);
      const createRes = await agent.post("/api/admin/classes").send({ name: "adminclass-restore" });
      const { classId } = createRes.body;

      await agent.patch(`/api/admin/classes/${classId}`).send({ status: "ARCHIVED" });
      const restoreRes = await agent.patch(`/api/admin/classes/${classId}`).send({ status: "ACTIVE" });
      expect(restoreRes.status).toBe(200);

      const listRes = await agent.get("/api/admin/classes");
      const found = listRes.body.find((c: { id: string }) => c.id === classId);
      expect(found.status).toBe("ACTIVE");
    });
  });

  describe("admin.spec: class with students or quizzes cannot be deleted", () => {
    it("refuses to delete a class that has a student enrolled", async () => {
      const agent = await loginAs(admin.username, admin.password);
      const createRes = await agent.post("/api/admin/classes").send({ name: "adminclass-nonempty" });
      const { classId } = createRes.body;

      const passwordHash = await bcrypt.hash("x", 12);
      await prisma.user.create({
        data: {
          role: "STUDENT",
          name: "adminclass-roster-student",
          nameNormalized: "adminclass-roster-student",
          username: "adminclass-roster-student",
          passwordHash,
          classId,
        },
      });

      const deleteRes = await agent.delete(`/api/admin/classes/${classId}`);
      expect(deleteRes.status).toBe(409);
    });

    it("allows deleting an empty class", async () => {
      const agent = await loginAs(admin.username, admin.password);
      const createRes = await agent.post("/api/admin/classes").send({ name: "adminclass-empty" });
      const { classId } = createRes.body;

      const deleteRes = await agent.delete(`/api/admin/classes/${classId}`);
      expect(deleteRes.status).toBe(204);
    });
  });

  describe("admin.spec: move student preserves past attempts and updates future quiz visibility", () => {
    it("reassigns the student's classId without touching existing attempts", async () => {
      const agent = await loginAs(admin.username, admin.password);
      const fromClass = await agent.post("/api/admin/classes").send({ name: "adminclass-from" });
      const toClass = await agent.post("/api/admin/classes").send({ name: "adminclass-to" });

      const passwordHash = await bcrypt.hash("x", 12);
      const student = await prisma.user.create({
        data: {
          role: "STUDENT",
          name: "adminclass-mover",
          nameNormalized: "adminclass-mover",
          username: "adminclass-mover",
          passwordHash,
          classId: fromClass.body.classId,
        },
      });

      const moveRes = await agent
        .post(`/api/admin/classes/${fromClass.body.classId}/students/${student.id}/move`)
        .send({ toClassId: toClass.body.classId });
      expect(moveRes.status).toBe(200);

      const updated = await prisma.user.findUniqueOrThrow({ where: { id: student.id } });
      expect(updated.classId).toBe(toClass.body.classId);
    });
  });
});
