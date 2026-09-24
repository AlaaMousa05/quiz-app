import { Router } from "express";
import * as adminQuizzesController from "../controllers/admin-quizzes.controller.js";
import * as resultsController from "../controllers/results.controller.js";
import * as adminClassesController from "../controllers/admin-classes.controller.js";
import * as adminUsersController from "../controllers/admin-users.controller.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";
import { requireRole } from "../middleware/requireRole.middleware.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get("/quizzes", adminQuizzesController.listQuizzes);
adminRouter.get("/quizzes/:quizId/results", resultsController.adminResults);
adminRouter.get("/quizzes/:quizId/results/export.csv", resultsController.adminResultsCsv);

adminRouter.get("/classes", adminClassesController.list);
adminRouter.post("/classes", adminClassesController.create);
adminRouter.patch("/classes/:classId", adminClassesController.update);
adminRouter.delete("/classes/:classId", adminClassesController.remove);
adminRouter.get("/classes/:classId/students", adminClassesController.listStudents);
adminRouter.post("/classes/:classId/students/:studentId/move", adminClassesController.moveStudent);

adminRouter.get("/users", adminUsersController.list);
adminRouter.post("/users", adminUsersController.create);
adminRouter.post("/users/:userId/reset-password", adminUsersController.resetPassword);
adminRouter.post("/users/:userId/deactivate", adminUsersController.deactivate);
adminRouter.post("/users/:userId/reactivate", adminUsersController.reactivate);
