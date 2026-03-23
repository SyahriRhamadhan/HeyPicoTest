import axios from "axios";
import { z } from "zod";
import { config } from "../config.js";

const intentSchema = z.object({
  query: z.string().min(1).optional(),
  location: z.string().min(1).nullable().optional(),
  placeType: z.string().min(1).nullable().optional()
});

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

const extractLocationFromPrompt = (prompt) => {
  const normalizedPrompt = prompt.trim();
  const patterns = [
    /\b(?:in)\s+([a-zA-Z\s]+)$/i,
    /\b(?:di)\s+([a-zA-Z\s]+)$/i
  ];

  for (const pattern of patterns) {
    const match = normalizedPrompt.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return "";
};

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
  const intent = intentSchema.parse(parsed);
  const locationFromPrompt = extractLocationFromPrompt(prompt);

  return {
    query: normalizeText(intent.query) || prompt,
    location: normalizeText(intent.location) || locationFromPrompt || config.defaultLocation,
    placeType: normalizeText(intent.placeType) || "place"
  };
};

export const askGeneralQuestion = async (prompt) => {
  const systemPrompt =
    "You are a concise helpful assistant. Reply clearly and directly. If needed, use short bullet points.";

  const { data } = await axios.post(
    `${config.ollamaBaseUrl}/api/generate`,
    {
      model: config.ollamaModel,
      prompt: `${systemPrompt}\nUser: ${prompt}`,
      stream: false,
      options: {
        temperature: 0.4
      }
    },
    {
      timeout: 30_000
    }
  );

  return String(data?.response || "").trim();
};
