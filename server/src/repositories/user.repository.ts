import { prisma } from "./prismaClient.js";

export function findByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
}

export function findById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}
