import { z } from "zod";

export const promptSchema = z.object({
  prompt: z.string().min(5).max(500),
  model: z.string().min(1).max(120).optional(),
  browserLocation: z
    .object({
      lat: z.number(),
      lng: z.number()
    })
    .optional()
});
