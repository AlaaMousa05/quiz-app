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

describe("admin-users.routes", () => {
  let admin: Awaited<ReturnType<typeof createAdmin>>;

  beforeAll(async () => {
    admin = await createAdmin("adminusers-admin-1");
  });

  afterAll(async () => {
    await prisma.importBatch.deleteMany({ where: { uploadedByUserId: admin.id } });
    await prisma.user.deleteMany({
      where: { OR: [{ username: { startsWith: "adminusers-" } }, { name: { startsWith: "adminusers-" } }] },
    });
    await prisma.class.deleteMany({ where: { name: { startsWith: "adminusers-" } } });
    await prisma.$disconnect();
  });

  describe("admin.spec: deactivated user cannot log in but history is retained", () => {
    it("blocks login after deactivate, allows it again after reactivate, without deleting the user", async () => {
      const agent = await loginAs(admin.username, admin.password);
      const createRes = await agent.post("/api/admin/users").send({ name: "adminusers-deactivate-target", role: "TEACHER" });
      expect(createRes.status).toBe(201);
      const { userId, username, temporaryPassword } = createRes.body;

      const deactivateRes = await agent.post(`/api/admin/users/${userId}/deactivate`);
      expect(deactivateRes.status).toBe(200);

      const loginBlocked = await request(app).post("/api/auth/login").send({ username, password: temporaryPassword });
      expect(loginBlocked.status).toBe(403);

      const stillThere = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      expect(stillThere.status).toBe("DEACTIVATED");

      const reactivateRes = await agent.post(`/api/admin/users/${userId}/reactivate`);
      expect(reactivateRes.status).toBe(200);

      const loginAllowed = await request(app).post("/api/auth/login").send({ username, password: temporaryPassword });
      expect(loginAllowed.status).toBe(200);
    });
  });

  describe("POST /api/admin/users", () => {
    it("generates a student ID in the form S<class><NN> (FR-016)", async () => {
      const agent = await loginAs(admin.username, admin.password);
      const classRes = await agent.post("/api/admin/classes").send({ name: "adminusers-9A" });
      const { classId } = classRes.body;

      const res = await agent.post("/api/admin/users").send({ name: "adminusers-new-student", role: "STUDENT", classId });
      expect(res.status).toBe(201);
      // Class names get their non-alphanumeric characters stripped when
      // building the username, so "adminusers-9A" (the test-isolation
      // prefix) becomes "adminusers9A" — still matches S<class><NN>.
      expect(res.body.username).toMatch(/^Sadminusers9A\d{2}$/);
    });
  });

  describe("import.spec: valid rows create accounts/quiz content (student/teacher variant)", () => {
    it("imports valid student rows, auto-creating a missing class (FR-020a)", async () => {
      const agent = await loginAs(admin.username, admin.password);
      const csv = "Name,Class\nadminusers-imported-1,adminusers-newclass\nadminusers-imported-2,adminusers-newclass\n";

      const previewRes = await agent
        .post("/api/imports/students/preview")
        .attach("file", Buffer.from(csv, "utf-8"), "students.csv");
      expect(previewRes.status).toBe(200);
      expect(previewRes.body.summary.willImport).toBe(2);
      expect(previewRes.body.summary.newClasses).toContain("adminusers-newclass");

      const confirmRes = await agent
        .post("/api/imports/students/confirm")
        .attach("file", Buffer.from(csv, "utf-8"), "students.csv");
      expect(confirmRes.status).toBe(201);
      expect(confirmRes.body.created).toHaveLength(2);
      expect(confirmRes.body.created[0]).toHaveProperty("temporaryPassword");

      const createdClass = await prisma.class.findUnique({ where: { name: "adminusers-newclass" } });
      expect(createdClass).not.toBeNull();
    });

    it("preview shows per-row errors before saving, without blocking the valid rows", async () => {
      const agent = await loginAs(admin.username, admin.password);
      const csv = "Name,Class\nadminusers-valid-row,adminusers-preview-class\n,adminusers-preview-class\n";

      const res = await agent.post("/api/imports/students/preview").attach("file", Buffer.from(csv, "utf-8"), "students.csv");
      expect(res.status).toBe(200);
      // This class doesn't exist yet in this test's isolated slice of data,
      // so the valid row is correctly flagged as creating a new class too.
      expect(["OK", "OK_NEW_CLASS"]).toContain(res.body.rows[0].status);
      expect(res.body.rows[1].status).toBe("ERROR");
    });

    it("skips a duplicate row (same name+class already imported) rather than erroring (FR-020)", async () => {
      const agent = await loginAs(admin.username, admin.password);
      const csv = "Name,Class\nadminusers-dup,adminusers-dup-class\n";
      await agent.post("/api/imports/students/confirm").attach("file", Buffer.from(csv, "utf-8"), "students.csv");

      const secondPreview = await agent
        .post("/api/imports/students/preview")
        .attach("file", Buffer.from(csv, "utf-8"), "students.csv");
      expect(secondPreview.body.rows[0].status).toBe("DUPLICATE_SKIPPED");
    });

    it("imports teacher rows without a class field", async () => {
      const agent = await loginAs(admin.username, admin.password);
      const csv = "Name\nadminusers-imported-teacher\n";

      const confirmRes = await agent
        .post("/api/imports/teachers/confirm")
        .attach("file", Buffer.from(csv, "utf-8"), "teachers.csv");
      expect(confirmRes.status).toBe(201);
      expect(confirmRes.body.created).toHaveLength(1);

      const created = await prisma.user.findUnique({ where: { id: confirmRes.body.created[0].userId } });
      expect(created?.role).toBe("TEACHER");
    });
  });
});
