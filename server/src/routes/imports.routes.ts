import { Router } from "express";
import multer from "multer";
import * as controller from "../controllers/imports.controller.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";
import { requireRole } from "../middleware/requireRole.middleware.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const importsRouter = Router();
importsRouter.use(requireAuth, requireRole("TEACHER", "ADMIN"));

importsRouter.post("/quiz/preview", upload.single("file"), controller.previewQuiz);
importsRouter.post("/quiz/confirm", upload.single("file"), controller.confirmQuiz);
