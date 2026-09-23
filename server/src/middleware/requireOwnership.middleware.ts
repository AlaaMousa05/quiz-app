import type { Request, RequestHandler } from "express";
import { ForbiddenError, NotFoundError } from "../errors/index.js";

/**
 * Generic ownership check: loadOwnerId resolves the userId that owns the
 * resource identified by the request (e.g. a quiz's ownerTeacherId). Returns
 * null when the resource itself doesn't exist, so callers get a 404 instead
 * of a 403 that would leak whether the resource exists.
 */
export function requireOwnership(loadOwnerId: (req: Request) => Promise<string | null>): RequestHandler {
  return (req, _res, next) => {
    loadOwnerId(req)
      .then((ownerId) => {
        if (ownerId === null) {
          next(new NotFoundError("Not found."));
          return;
        }
        if (ownerId !== req.session.userId) {
          next(new ForbiddenError("You don't own this resource."));
          return;
        }
        next();
      })
      .catch(next);
  };
}
