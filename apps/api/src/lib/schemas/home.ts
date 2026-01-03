import { z } from "zod";

export const HomeSummaryResponseSchema = z.object({
  tasks: z
    .object({
      todo: z.number().int().nonnegative(),
      overdue: z.number().int().nonnegative(),
    })
    .optional(),
  meetings: z
    .object({
      reviewPending: z.number().int().nonnegative(),
    })
    .optional(),
  leads: z
    .object({
      new7d: z.number().int().nonnegative(),
    })
    .optional(),
  schedule: z
    .object({
      today: z.number().int().nonnegative(),
    })
    .optional(),
  time: z
    .object({
      missing: z.number().int().nonnegative(),
    })
    .optional(),
  ai: z
    .object({
      available: z.boolean(),
    })
    .optional(),
});

export type HomeSummaryResponse = z.infer<typeof HomeSummaryResponseSchema>;
