import type { NextFunction, Request, Response } from "express";
import { userCreateSchema } from "shared";
import * as userService from "../services/user.service.js";

// req.params.userId is asserted non-null because every route declares the
// :userId segment — Express only invokes the handler once matched.

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await userService.list());
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = userCreateSchema.parse(req.body);
    res.status(201).json(await userService.create(input));
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await userService.resetPassword(req.params.userId!));
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req: Request, res: Response, next: NextFunction) {
  try {
    await userService.deactivate(req.params.userId!);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function reactivate(req: Request, res: Response, next: NextFunction) {
  try {
    await userService.reactivate(req.params.userId!);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}
