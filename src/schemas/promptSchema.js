import { z } from "zod";

export const promptSchema = z.object({
  prompt: z.string().min(5).max(500),
  browserLocation: z
    .object({
      lat: z.number(),
      lng: z.number()
    })
    .optional()
});

