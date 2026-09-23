import { Router } from "express";
import * as controller from "../controllers/student-quizzes.controller.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";
import { requireRole } from "../middleware/requireRole.middleware.js";

export const studentQuizzesRouter = Router();
studentQuizzesRouter.use(requireAuth, requireRole("STUDENT"));

studentQuizzesRouter.get("/quizzes", controller.list);
studentQuizzesRouter.get("/quizzes/:quizId", controller.intro);
studentQuizzesRouter.post("/quizzes/:quizId/attempts", controller.start);
studentQuizzesRouter.get("/attempts/:attemptId", controller.resume);
studentQuizzesRouter.patch("/attempts/:attemptId/answers", controller.saveAnswer);
studentQuizzesRouter.post("/attempts/:attemptId/submit", controller.submit);
studentQuizzesRouter.get("/attempts/:attemptId/result", controller.result);
studentQuizzesRouter.get("/attempts/:attemptId/review", controller.review);
