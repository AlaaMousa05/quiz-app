import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Env } from "../config/env.js";

const PgSession = connectPgSimple(session);

export const SESSION_COOKIE_NAME = "quizapp.sid";
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

// One connection pool per database, reused across createApp() calls (each
// test file calls createApp() at least once) instead of opening a fresh
// pg pool — separate from Prisma's — every time.
const storesByDatabaseUrl = new Map<string, InstanceType<typeof PgSession>>();

function getStore(env: Env) {
  let store = storesByDatabaseUrl.get(env.DATABASE_URL);
  if (!store) {
    store = new PgSession({ conString: env.DATABASE_URL, tableName: "session", createTableIfMissing: true });
    storesByDatabaseUrl.set(env.DATABASE_URL, store);
  }
  return store;
}

export function sessionMiddleware(env: Env) {
  return session({
    store: getStore(env),
    name: SESSION_COOKIE_NAME,
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      // The app container serves plain HTTP on its own (no TLS termination
      // in this deployment, per docker-compose.yml) — a `Secure` cookie
      // would silently never be stored by the browser.
      secure: false,
      maxAge: SESSION_MAX_AGE_MS,
    },
  });
}
