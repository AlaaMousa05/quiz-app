import type { NextFunction, Request, Response } from "express";
import { classCreateSchema, classUpdateSchema, moveStudentSchema } from "shared";
import * as classService from "../services/class.service.js";

// req.params.* below are asserted non-null because every route declares the
// corresponding :param segment — Express only invokes the handler once matched.

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await classService.list());
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = classCreateSchema.parse(req.body);
    res.status(201).json(await classService.create(input));
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = classUpdateSchema.parse(req.body);
    await classService.update(req.params.classId!, input);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await classService.remove(req.params.classId!);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function listStudents(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await classService.listStudents(req.params.classId!));
  } catch (err) {
    next(err);
  }
}

export async function moveStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const input = moveStudentSchema.parse(req.body);
    await classService.move(req.params.classId!, req.params.studentId!, input.toClassId);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}
