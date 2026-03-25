import { z } from "zod";

export const promptSchema = z.object({
  prompt: z.string().min(5).max(500),
  chatId: z.string().min(1).max(64).optional(),
  model: z.string().min(1).max(120).optional(),
  context: z
    .object({
      lastUserPrompt: z.string().max(500).optional()
    })
    .optional(),
  browserLocation: z
    .object({
      lat: z.number(),
      lng: z.number()
    })
    .optional()
});
