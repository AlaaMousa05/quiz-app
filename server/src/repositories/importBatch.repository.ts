import type { ImportType } from "@prisma/client";
import { prisma } from "./prismaClient.js";

export function createImportBatch(data: {
  type: ImportType;
  uploadedByUserId: string;
  fileName: string;
  rowsTotal: number;
  rowsCreated: number;
  rowsSkippedDuplicate: number;
  rowsFailed: number;
}) {
  return prisma.importBatch.create({ data });
}
