import type { NextFunction, Request, Response } from "express";
import { quizImportConfirmFieldsSchema } from "shared";
import * as importService from "../services/import.service.js";
import { ValidationError } from "../errors/index.js";

function requireFile(req: Request) {
  if (!req.file) {
    throw new ValidationError("A file is required.");
  }
  return req.file;
}

function resolveOwnerTeacherId(req: Request): string {
  if (req.session.role === "TEACHER") {
    // requireAuth guarantees session.userId is set for any authenticated role.
    return req.session.userId!;
  }
  const ownerTeacherId = req.body.ownerTeacherId as string | undefined;
  if (!ownerTeacherId) {
    throw new ValidationError("ownerTeacherId is required when importing as an admin.");
  }
  return ownerTeacherId;
}

export async function previewQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const file = requireFile(req);
    res.json(await importService.previewQuizImport(file.buffer, file.originalname));
  } catch (err) {
    next(err);
  }
}

export async function confirmQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const file = requireFile(req);
    const settings = quizImportConfirmFieldsSchema.parse(req.body);
    const ownerTeacherId = resolveOwnerTeacherId(req);
    const result = await importService.confirmQuizImport(file.buffer, file.originalname, ownerTeacherId, settings);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
