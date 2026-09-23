import type { RequestHandler } from "express";
import type { Role } from "shared";
import { ForbiddenError } from "../errors/index.js";

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.session.role || !roles.includes(req.session.role)) {
      next(new ForbiddenError("You don't have access to this resource."));
      return;
    }
    next();
  };
}
