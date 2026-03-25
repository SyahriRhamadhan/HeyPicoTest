import axios from "axios";
import { z } from "zod";
import { config } from "../config.js";

const intentSchema = z.object({
  query: z.string().optional(),
  location: z.string().nullable().optional(),
  placeType: z.string().nullable().optional()
});

const assistantActionSchema = z.object({
  action: z.enum(["map_search", "current_location", "current_location_map", "chat"]),
  query: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  placeType: z.string().nullable().optional()
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

export const planAssistantAction = async ({ prompt, hasBrowserLocation }) => {
  const systemPrompt = `You are an assistant router. Return JSON only with keys:
- action: one of "map_search" | "current_location" | "current_location_map" | "chat"
- query: string or null
- location: string or null
- placeType: string or null

Rules:
1) Use "current_location" only when user asks for their own current location.
2) Use "current_location_map" when user asks to mark/pin/show their current location on map.
3) Use "map_search" when user asks to find places/directions/nearby locations.
4) Use "chat" for general Q&A.
5) Do not invent location. If location is not explicitly in prompt, set location to null.
6) Keep query concise for map search.
7) hasBrowserLocation=${hasBrowserLocation ? "true" : "false"} (context only).`;

  const { data } = await axios.post(
    `${config.ollamaBaseUrl}/api/generate`,
    {
      model: config.ollamaModel,
      prompt: `${systemPrompt}\nUser prompt: "${prompt}"`,
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
  const route = assistantActionSchema.parse(parsed);

  return {
    action: route.action,
    query: normalizeText(route.query),
    location: normalizeText(route.location),
    placeType: normalizeText(route.placeType) || "place"
  };
};
