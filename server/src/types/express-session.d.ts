import "express-session";
import type { Role } from "shared";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    role?: Role;
    name?: string;
    username?: string;
    classId?: string | null;
  }
}
