import { Router } from "express";
import * as controller from "../controllers/student-quizzes.controller.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";
import { requireRole } from "../middleware/requireRole.middleware.js";

export const studentQuizzesRouter = Router();

// Applied per-route rather than via a router-level `.use()`: this router is
// mounted at the broad "/api" prefix (shared with teacher/imports/admin
// routers), and `router.use(mw)` with no path runs for every request that
// reaches the router — including ones that don't match any route below and
// would otherwise fall through to a sibling router. A router-level guard
// here would reject every "/api/teacher/*"/"/api/imports/*" request as
// STUDENT-only before Express ever got to try matching them elsewhere.
const guard = [requireAuth, requireRole("STUDENT")];

studentQuizzesRouter.get("/quizzes", ...guard, controller.list);
studentQuizzesRouter.get("/quizzes/:quizId", ...guard, controller.intro);
studentQuizzesRouter.post("/quizzes/:quizId/attempts", ...guard, controller.start);
studentQuizzesRouter.get("/attempts/:attemptId", ...guard, controller.resume);
studentQuizzesRouter.patch("/attempts/:attemptId/answers", ...guard, controller.saveAnswer);
studentQuizzesRouter.post("/attempts/:attemptId/submit", ...guard, controller.submit);
studentQuizzesRouter.get("/attempts/:attemptId/result", ...guard, controller.result);
studentQuizzesRouter.get("/attempts/:attemptId/review", ...guard, controller.review);
