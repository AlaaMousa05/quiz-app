import { Router } from "express";
import * as adminQuizzesController from "../controllers/admin-quizzes.controller.js";
import * as resultsController from "../controllers/results.controller.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";
import { requireRole } from "../middleware/requireRole.middleware.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get("/quizzes", adminQuizzesController.listQuizzes);
adminRouter.get("/quizzes/:quizId/results", resultsController.adminResults);
adminRouter.get("/quizzes/:quizId/results/export.csv", resultsController.adminResultsCsv);
