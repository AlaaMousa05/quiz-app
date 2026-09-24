import { z } from "zod";

export const classCreateSchema = z.object({
  name: z.string().trim().min(1),
});

export const classUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

export const moveStudentSchema = z.object({
  toClassId: z.string().min(1),
});

export type ClassCreateInput = z.infer<typeof classCreateSchema>;
export type ClassUpdateInput = z.infer<typeof classUpdateSchema>;
export type MoveStudentInput = z.infer<typeof moveStudentSchema>;
