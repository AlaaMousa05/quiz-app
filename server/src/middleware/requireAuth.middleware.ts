import type { RequestHandler } from "express";
import { UnauthorizedError } from "../errors/index.js";

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.session.userId) {
    next(new UnauthorizedError("Authentication required."));
    return;
  }
  next();
};
