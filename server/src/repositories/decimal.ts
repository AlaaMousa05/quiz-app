import { Prisma } from "@prisma/client";

// Repositories are the only layer allowed to import from @prisma/client
// directly. Services need the Decimal class for scoring math, so it's
// re-exported here rather than imported straight from @prisma/client in a
// service file — this is the same Prisma.Decimal instance Prisma returns
// from DB-loaded rows, so arithmetic against real query results stays safe.
export const Decimal = Prisma.Decimal;
export type Decimal = Prisma.Decimal;
