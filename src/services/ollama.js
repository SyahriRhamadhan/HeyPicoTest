import axios from "axios";
import { z } from "zod";
import { config } from "../config.js";

const intentSchema = z.object({
  query: z.string().optional(),
  location: z.string().nullable().optional(),
  placeType: z.string().nullable().optional()
});

const assistantActionSchema = z.object({
  action: z.enum(["map_search", "current_location", "current_location_map", "chat", "answer_and_map"]),
  query: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  placeType: z.string().nullable().optional(),
  mapEntity: z.string().nullable().optional()
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

const resolveModel = (model) => normalizeText(model) || config.ollamaModel;

export const extractIntent = async (prompt, model) => {
  const systemPrompt =
    'You are an intent parser for map search. Return JSON only with keys: "query", "location", "placeType".';
  const userPrompt = `User prompt: "${prompt}"`;

  const { data } = await axios.post(
    `${config.ollamaBaseUrl}/api/generate`,
    {
      model: resolveModel(model),
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

export const askGeneralQuestion = async (prompt) => askGeneralQuestionWithModel(prompt, undefined);

export const planAssistantAction = async ({ prompt, hasBrowserLocation, model }) => {
  const systemPrompt = `You are an assistant router. Return JSON only with keys:
- action: one of "map_search" | "current_location" | "current_location_map" | "chat" | "answer_and_map"
- query: string or null
- location: string or null
- placeType: string or null
- mapEntity: string or null

Rules:
1) Use "current_location" only when user asks for their own current location.
2) Use "current_location_map" when user asks to mark/pin/show their current location on map.
3) Use "map_search" when user asks to find places/directions/nearby locations.
4) Use "answer_and_map" when user asks a factual/general question and also asks to show that answer on map.
5) Use "chat" for general Q&A.
6) Do not invent location. If location is not explicitly in prompt, set location to null.
7) Keep query concise for map search.
8) For "answer_and_map", fill mapEntity with the place/location to be shown.
9) hasBrowserLocation=${hasBrowserLocation ? "true" : "false"} (context only).`;

  const { data } = await axios.post(
    `${config.ollamaBaseUrl}/api/generate`,
    {
      model: resolveModel(model),
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
    placeType: normalizeText(route.placeType) || "place",
    mapEntity: normalizeText(route.mapEntity)
  };
};

export const extractMapEntity = async ({ prompt, answer, model }) => {
  const systemPrompt = `Extract the location/place entity to show on map.
Return JSON only: {"entity":"<string or empty>"}.
If no clear map entity exists, return empty string.`;
  const userPrompt = `Prompt: "${prompt}"\nAnswer: "${answer}"`;

  const { data } = await axios.post(
    `${config.ollamaBaseUrl}/api/generate`,
    {
      model: resolveModel(model),
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

  const parsed = JSON.parse(extractJsonObject(data.response));
  return normalizeText(parsed?.entity);
};

export const extractMapEntityFromPrompt = async ({ prompt, model }) => {
  return extractMapEntity({ prompt, answer: "", model });
};

export const isCurrentLocationIntent = async ({ prompt, model }) => {
  const systemPrompt = `Decide if user asks specifically for THEIR OWN current/device location.
Return JSON only: {"isCurrentLocation": true|false}
Examples true: "where am i", "lokasi saya sekarang", "pin my location", "tandai lokasi saya di map"
Examples false: "show singapore on map", "tunjukkan jakarta di peta", "where is eiffel tower"`;

  const { data } = await axios.post(
    `${config.ollamaBaseUrl}/api/generate`,
    {
      model: resolveModel(model),
      prompt: `${systemPrompt}\nPrompt: "${prompt}"`,
      stream: false,
      options: {
        temperature: 0
      }
    },
    {
      timeout: 30_000
    }
  );

  const parsed = JSON.parse(extractJsonObject(data.response));
  return Boolean(parsed?.isCurrentLocation);
};

export const classifyMapQueryMode = async ({ prompt, query, model }) => {
  const systemPrompt = `Classify map query type.
Return JSON only: {"mode":"entity"|"nearby"}
- "entity": user asks to show a specific place/entity on map (e.g. singapore, jakarta, eiffel tower).
- "nearby": user asks category search needing area/context (e.g. pharmacy, coffee shops, restaurant).`;

  const { data } = await axios.post(
    `${config.ollamaBaseUrl}/api/generate`,
    {
      model: resolveModel(model),
      prompt: `${systemPrompt}\nPrompt: "${prompt}"\nQuery: "${query}"`,
      stream: false,
      options: {
        temperature: 0
      }
    },
    {
      timeout: 30_000
    }
  );

  const parsed = JSON.parse(extractJsonObject(data.response));
  return parsed?.mode === "entity" ? "entity" : "nearby";
};

export const askGeneralQuestionWithModel = async (prompt, model) => {
  const systemPrompt =
    "You are a concise helpful assistant. Reply clearly and directly. If needed, use short bullet points.";

  const { data } = await axios.post(
    `${config.ollamaBaseUrl}/api/generate`,
    {
      model: resolveModel(model),
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

export const listLocalModels = async () => {
  const { data } = await axios.get(`${config.ollamaBaseUrl}/api/tags`, {
    timeout: 15_000
  });

  const models = (data?.models ?? [])
    .map((item) => normalizeText(item?.name))
    .filter(Boolean);

  return models;
};
