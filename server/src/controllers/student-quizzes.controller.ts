import type { NextFunction, Request, Response } from "express";
import { answerSaveSchema } from "shared";
import * as attemptService from "../services/attempt.service.js";
import * as attemptFinalizeService from "../services/attemptFinalize.service.js";
import * as studentQuizService from "../services/studentQuiz.service.js";

// requireAuth + requireRole("STUDENT") (mounted on this router) guarantee
// these session fields are set; classId is required (non-null) for STUDENT
// accounts (data-model.md).
function studentContext(req: Request) {
  return { studentId: req.session.userId!, classId: req.session.classId! };
}

// req.params.* below are asserted non-null because every route on this
// router declares the corresponding :param segment — Express only invokes
// the handler once it has matched and populated it.

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId, classId } = studentContext(req);
    res.json(await studentQuizService.listQuizzesForStudent(studentId, classId));
  } catch (err) {
    next(err);
  }
}

export async function intro(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId, classId } = studentContext(req);
    res.json(await studentQuizService.getQuizIntro(req.params.quizId!, studentId, classId));
  } catch (err) {
    next(err);
  }
}

export async function start(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId, classId } = studentContext(req);
    res.status(201).json(await attemptService.startAttempt(req.params.quizId!, studentId, classId));
  } catch (err) {
    next(err);
  }
}

export async function resume(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = studentContext(req);
    res.json(await attemptService.getAttemptForResume(req.params.attemptId!, studentId));
  } catch (err) {
    next(err);
  }
}

export async function saveAnswer(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = studentContext(req);
    const input = answerSaveSchema.parse(req.body);
    const { savedAt } = await attemptService.saveAnswer(req.params.attemptId!, studentId, input);
    res.json({ savedAt: savedAt.toISOString() });
  } catch (err) {
    next(err);
  }
}

export async function submit(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = studentContext(req);
    res.json(await attemptService.submitAttempt(req.params.attemptId!, studentId));
  } catch (err) {
    next(err);
  }
}

export async function result(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = studentContext(req);
    res.json(await attemptFinalizeService.getAttemptResult(req.params.attemptId!, studentId));
  } catch (err) {
    next(err);
  }
}

export async function review(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = studentContext(req);
    res.json(await attemptFinalizeService.getAttemptReview(req.params.attemptId!, studentId));
  } catch (err) {
    next(err);
  }
}
