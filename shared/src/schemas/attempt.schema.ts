import { z } from "zod";

export const answerSaveSchema = z.object({
  questionId: z.string().min(1),
  optionId: z.string().min(1).nullable(),
});

export type AnswerSaveInput = z.infer<typeof answerSaveSchema>;
