import axios from "axios";
import { z } from "zod";
import { config } from "../config.js";

const intentSchema = z.object({
  query: z.string().min(1),
  location: z.string().min(1),
  placeType: z.string().min(1).default("place")
});

const extractJsonObject = (rawText) => {
  const start = rawText.indexOf("{");
  const end = rawText.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("LLM response does not contain a valid JSON object.");
  }

  return rawText.slice(start, end + 1);
};

export const extractIntent = async (prompt) => {
  const systemPrompt =
    'You are an intent parser for map search. Return JSON only with keys: "query", "location", "placeType".';
  const userPrompt = `User prompt: "${prompt}"`;

  const { data } = await axios.post(
    `${config.ollamaBaseUrl}/api/generate`,
    {
      model: config.ollamaModel,
      prompt: `${systemPrompt}\n${userPrompt}`,
      stream: false,
      options: {
        temperature: 0
      }
    },
    {
      timeout: 30_000
    }
  );

  const jsonString = extractJsonObject(data.response);
  const parsed = JSON.parse(jsonString);

  return intentSchema.parse(parsed);
};
