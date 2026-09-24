import { z } from "zod";

const quizSettingsShape = {
  title: z.string().trim().min(1),
  classIds: z.array(z.string().min(1)).min(1),
  opensAt: z.coerce.date(),
  closesAt: z.coerce.date(),
  timeLimitMinutes: z.coerce.number().int().positive().default(20),
  negMarkEnabled: z.boolean().optional(),
  negMarkPenalty: z.coerce.number().min(0).max(1).optional(),
};

function requiresPenaltyWhenEnabled(data: { negMarkEnabled?: boolean; negMarkPenalty?: number }) {
  return !data.negMarkEnabled || data.negMarkPenalty !== undefined;
}

// quizSettingsBaseSchema (no refinements) is exported separately so
// `.partial()` can build the PATCH variant — Zod's `.refine()` result is a
// ZodEffects wrapper that no longer exposes `.partial()`.
export const quizSettingsBaseSchema = z.object(quizSettingsShape);

export const quizSettingsSchema = quizSettingsBaseSchema
  .refine((data) => data.closesAt > data.opensAt, { message: "Closes must be after Opens", path: ["closesAt"] })
  .refine(requiresPenaltyWhenEnabled, { message: "negMarkPenalty is required when negMarkEnabled", path: ["negMarkPenalty"] });

export const quizSettingsUpdateSchema = quizSettingsBaseSchema.partial().refine(
  (data) => data.opensAt === undefined || data.closesAt === undefined || data.closesAt > data.opensAt,
  { message: "Closes must be after Opens", path: ["closesAt"] },
);

export type QuizSettingsInput = z.infer<typeof quizSettingsSchema>;
export type QuizSettingsUpdateInput = z.infer<typeof quizSettingsUpdateSchema>;
