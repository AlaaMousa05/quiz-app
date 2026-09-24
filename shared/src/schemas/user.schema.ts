import { z } from "zod";

export const userCreateSchema = z
  .object({
    name: z.string().trim().min(1),
    role: z.enum(["TEACHER", "STUDENT"]),
    classId: z.string().min(1).optional(),
  })
  .refine((data) => data.role !== "STUDENT" || data.classId !== undefined, {
    message: "classId is required for a STUDENT",
    path: ["classId"],
  });

export type UserCreateInput = z.infer<typeof userCreateSchema>;
