import { prisma } from "./prismaClient.js";

export function listActiveClasses() {
  return prisma.class.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
}
