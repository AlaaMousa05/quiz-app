import { Router } from "express";
import * as controller from "../controllers/teacher-quizzes.controller.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";
import { requireRole } from "../middleware/requireRole.middleware.js";

export const teacherQuizzesRouter = Router();
teacherQuizzesRouter.use(requireAuth, requireRole("TEACHER"));

teacherQuizzesRouter.get("/classes", controller.listClasses);
teacherQuizzesRouter.get("/quizzes", controller.list);
teacherQuizzesRouter.post("/quizzes", controller.create);
teacherQuizzesRouter.get("/quizzes/:quizId", controller.getOne);
teacherQuizzesRouter.patch("/quizzes/:quizId", controller.update);
teacherQuizzesRouter.post("/quizzes/:quizId/questions", controller.addQuestion);
teacherQuizzesRouter.patch("/quizzes/:quizId/questions/:questionId", controller.editQuestion);
teacherQuizzesRouter.delete("/quizzes/:quizId/questions/:questionId", controller.deleteQuestion);
teacherQuizzesRouter.post("/quizzes/:quizId/publish", controller.publish);
teacherQuizzesRouter.post("/quizzes/:quizId/unpublish", controller.unpublish);
