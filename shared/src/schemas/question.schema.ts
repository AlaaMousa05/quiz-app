import { z } from "zod";

export const questionOptionSchema = z.object({
  text: z.string().trim().min(1),
  isCorrect: z.boolean(),
});

export const questionSchema = z
  .object({
    text: z.string().trim().min(1),
    points: z.coerce.number().positive(),
    options: z.array(questionOptionSchema).length(4),
  })
  .refine((data) => data.options.filter((o) => o.isCorrect).length === 1, {
    message: "Exactly one option must be marked correct",
    path: ["options"],
  });

export type QuestionInput = z.infer<typeof questionSchema>;
