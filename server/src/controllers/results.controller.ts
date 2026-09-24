import type { NextFunction, Request, Response } from "express";
import * as resultsService from "../services/quizResults.service.js";

// req.params.quizId is asserted non-null because every route below declares
// the :quizId segment — Express only invokes the handler once matched.

function sendCsv(res: Response, results: resultsService.ResultsResponse) {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="results.csv"');
  res.send(resultsService.toResultsCsv(results));
}

export async function teacherResults(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await resultsService.getResultsForTeacher(req.params.quizId!, req.session.userId!));
  } catch (err) {
    next(err);
  }
}

export async function teacherResultsCsv(req: Request, res: Response, next: NextFunction) {
  try {
    sendCsv(res, await resultsService.getResultsForTeacher(req.params.quizId!, req.session.userId!));
  } catch (err) {
    next(err);
  }
}

// No ownership check here — requireRole("ADMIN") on the route is the guard,
// per contracts/admin-scope.md's "same service, different middleware guard".
export async function adminResults(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await resultsService.getResults(req.params.quizId!));
  } catch (err) {
    next(err);
  }
}

export async function adminResultsCsv(req: Request, res: Response, next: NextFunction) {
  try {
    sendCsv(res, await resultsService.getResults(req.params.quizId!));
  } catch (err) {
    next(err);
  }
}
