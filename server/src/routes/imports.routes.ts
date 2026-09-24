import { Router } from "express";
import multer from "multer";
import * as controller from "../controllers/imports.controller.js";
import * as userImportsController from "../controllers/userImports.controller.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";
import { requireRole } from "../middleware/requireRole.middleware.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const importsRouter = Router();
importsRouter.use(requireAuth, requireRole("TEACHER", "ADMIN"));

importsRouter.post("/quiz/preview", upload.single("file"), controller.previewQuiz);
importsRouter.post("/quiz/confirm", upload.single("file"), controller.confirmQuiz);

// Student/teacher import is ADMIN-only (contracts/imports.md) — stricter
// than the router-level TEACHER-or-ADMIN gate above, so it's re-checked here.
const adminOnly = requireRole("ADMIN");
importsRouter.post("/students/preview", adminOnly, upload.single("file"), userImportsController.previewStudents);
importsRouter.post("/students/confirm", adminOnly, upload.single("file"), userImportsController.confirmStudents);
importsRouter.post("/teachers/preview", adminOnly, upload.single("file"), userImportsController.previewTeachers);
importsRouter.post("/teachers/confirm", adminOnly, upload.single("file"), userImportsController.confirmTeachers);
