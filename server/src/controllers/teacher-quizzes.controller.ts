import type { NextFunction, Request, Response } from "express";
import { quizSettingsSchema, quizSettingsUpdateSchema, questionSchema } from "shared";
import * as quizService from "../services/quiz.service.js";

// req.params.* below are asserted non-null because every route on this
// router declares the corresponding :param segment — Express only invokes
// the handler once it has matched and populated it.

export async function listClasses(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await quizService.listClassesForPicker());
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await quizService.listForTeacher(req.session.userId!));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await quizService.getForEditing(req.params.quizId!, req.session.userId!));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = quizSettingsSchema.parse(req.body);
    res.status(201).json(await quizService.create(req.session.userId!, input));
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = quizSettingsUpdateSchema.parse(req.body);
    await quizService.update(req.params.quizId!, req.session.userId!, input);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function addQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const input = questionSchema.parse(req.body);
    const question = await quizService.addQuestion(req.params.quizId!, req.session.userId!, input);
    res.status(201).json(question);
  } catch (err) {
    next(err);
  }
}

export async function editQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const input = questionSchema.parse(req.body);
    const question = await quizService.editQuestion(req.params.quizId!, req.params.questionId!, req.session.userId!, input);
    res.status(200).json(question);
  } catch (err) {
    next(err);
  }
}

export async function deleteQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    await quizService.removeQuestion(req.params.quizId!, req.params.questionId!, req.session.userId!);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function publish(req: Request, res: Response, next: NextFunction) {
  try {
    await quizService.publish(req.params.quizId!, req.session.userId!);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function unpublish(req: Request, res: Response, next: NextFunction) {
  try {
    await quizService.unpublish(req.params.quizId!, req.session.userId!);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}
