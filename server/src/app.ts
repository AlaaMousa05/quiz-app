import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import { loadEnv } from "./config/env.js";
import { sessionMiddleware } from "./middleware/session.middleware.js";
import { errorHandlerMiddleware } from "./middleware/errorHandler.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { studentQuizzesRouter } from "./routes/student-quizzes.routes.js";
import { NotFoundError } from "./errors/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(): Express {
  const env = loadEnv();
  const app = express();
  app.use(express.json());
  app.use(sessionMiddleware(env));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/api/auth", authRouter);
  app.use("/api", studentQuizzesRouter);
  app.use("/api", (_req, _res, next) => next(new NotFoundError("Not found.")));

  const clientDist = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });

  app.use(errorHandlerMiddleware);

  return app;
}
