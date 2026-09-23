import type { Request, Response, NextFunction } from "express";
import { loginSchema } from "shared";
import * as authService from "../services/auth.service.js";
import { SESSION_COOKIE_NAME } from "../middleware/session.middleware.js";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const user = await authService.login(username, password);

    // Regenerate the session ID on login so a session cookie fixed by an
    // attacker before login can't be inherited as an authenticated session.
    req.session.regenerate((err) => {
      if (err) {
        next(err);
        return;
      }
      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.name = user.name;
      req.session.username = user.username;
      req.session.classId = user.classId;
      res.json({ role: user.role, name: user.name, username: user.username });
    });
  } catch (err) {
    next(err);
  }
}

export function logout(req: Request, res: Response, next: NextFunction) {
  req.session.destroy((err) => {
    if (err) {
      next(err);
      return;
    }
    res.clearCookie(SESSION_COOKIE_NAME);
    res.status(204).end();
  });
}

export function me(req: Request, res: Response) {
  // requireAuth (mounted on this route) guarantees session.userId is set;
  // role/name/username are always written together with it at login, so
  // they're guaranteed present too.
  const { role, name, username } = req.session;
  res.json({ role: role!, name: name!, username: username! });
}
