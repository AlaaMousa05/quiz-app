import type { NextFunction, Request, Response } from "express";
import * as quizService from "../services/quiz.service.js";

export async function listQuizzes(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await quizService.listForAdmin());
  } catch (err) {
    next(err);
  }
}
