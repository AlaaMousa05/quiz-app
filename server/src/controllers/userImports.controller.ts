import type { NextFunction, Request, Response } from "express";
import * as userImportService from "../services/userImport.service.js";
import { ValidationError } from "../errors/index.js";

function requireFile(req: Request) {
  if (!req.file) {
    throw new ValidationError("A file is required.");
  }
  return req.file;
}

export async function previewStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const file = requireFile(req);
    res.json(await userImportService.previewStudentsImport(file.buffer, file.originalname));
  } catch (err) {
    next(err);
  }
}

export async function confirmStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const file = requireFile(req);
    // requireAuth + requireRole("ADMIN") guarantee session.userId is set.
    res.status(201).json(await userImportService.confirmStudentsImport(file.buffer, file.originalname, req.session.userId!));
  } catch (err) {
    next(err);
  }
}

export async function previewTeachers(req: Request, res: Response, next: NextFunction) {
  try {
    const file = requireFile(req);
    res.json(await userImportService.previewTeachersImport(file.buffer, file.originalname));
  } catch (err) {
    next(err);
  }
}

export async function confirmTeachers(req: Request, res: Response, next: NextFunction) {
  try {
    const file = requireFile(req);
    res.status(201).json(await userImportService.confirmTeachersImport(file.buffer, file.originalname, req.session.userId!));
  } catch (err) {
    next(err);
  }
}
