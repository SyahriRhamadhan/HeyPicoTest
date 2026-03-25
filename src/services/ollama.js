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

const followupDecisionSchema = z.object({
  usePreviousMapContext: z.boolean().optional()
});

const clarificationDecisionSchema = z.object({
  needsClarification: z.boolean().optional(),
  clarificationQuestion: z.string().nullable().optional()
});

const summaryTopicSchema = z.object({
  query: z.string().nullable().optional()
});

const memoryCommandSchema = z.object({
  isMemoryRequest: z.boolean().optional(),
  includePreviousChats: z.boolean().optional()
});

const mapEntityValiditySchema = z.object({
  isMeaningful: z.boolean().optional()
});

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

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

  return {
    query: normalizeText(intent.query) || prompt,
    location: normalizeText(intent.location),
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
- "entity": user asks to pin one specific named place/landmark/address (e.g. singapore, jakarta, eiffel tower, marina bay sands).
- "nearby": user asks category/discovery/list/recommendation queries (e.g. pharmacy, coffee shops, restaurant, "best hotel in singapore", "hotel terbaik di singapore", "cari cafe di batam").
Rules:
1) If the query implies "best/top/recommend/list/find/search/terbaik/rekomendasi", choose "nearby".
2) If query is a generic business type (hotel/cafe/restaurant/pharmacy/etc), choose "nearby".
3) Use "entity" only for a single concrete named target.
4) Prefer "nearby" when uncertain.`;

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

export const shouldUsePreviousMapContext = async ({ prompt, previousQuery, summary, model }) => {
  const systemPrompt = `Decide whether a user prompt is a follow-up that should reuse previous map search context.
Return JSON only: {"usePreviousMapContext": true|false}
Rules:
- true: prompt is vague/elliptical continuation (e.g. "coba carikan", "yang dekat pantai", "yang rating tinggi", "di batam").
- false: prompt introduces a clear new topic/entity/category.
- Prefer true when prompt lacks explicit category and previous context exists.
Previous query: "${previousQuery || ""}"
Summary: "${summary || ""}"`;

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

  const parsed = followupDecisionSchema.parse(JSON.parse(extractJsonObject(data.response)));
  return Boolean(parsed.usePreviousMapContext);
};

export const shouldClarifyMapSearch = async ({
  prompt,
  query,
  location,
  hasBrowserLocation,
  model
}) => {
  const systemPrompt = `You decide if a map-search request needs clarification.
Return JSON only with:
- needsClarification: true|false
- clarificationQuestion: string|null

Policy:
- needsClarification=true only when user intent is too ambiguous to run a useful map search.
- If user already provides enough context OR browser location is available, set false.
- If true, provide one short question asking city/area/category clearly.`;

  const { data } = await axios.post(
    `${config.ollamaBaseUrl}/api/generate`,
    {
      model: resolveModel(model),
      prompt: `${systemPrompt}
Prompt: "${prompt}"
Query: "${query || ""}"
Location: "${location || ""}"
HasBrowserLocation: ${hasBrowserLocation ? "true" : "false"}`,
      stream: false,
      options: {
        temperature: 0
      }
    },
    {
      timeout: 30_000
    }
  );

  const parsed = clarificationDecisionSchema.parse(JSON.parse(extractJsonObject(data.response)));
  return {
    needsClarification: Boolean(parsed.needsClarification),
    clarificationQuestion: normalizeText(parsed.clarificationQuestion) || null
  };
};

export const extractQueryFromSummary = async ({ summary, model }) => {
  const cleanedSummary = normalizeText(summary);
  if (!cleanedSummary) return "";

  const systemPrompt = `Extract the best map-search topic/category from summary text.
Return JSON only: {"query":"<string or empty>"}
Examples: "cafe", "pharmacy", "restaurant near beach".`;

  const { data } = await axios.post(
    `${config.ollamaBaseUrl}/api/generate`,
    {
      model: resolveModel(model),
      prompt: `${systemPrompt}\nSummary: "${cleanedSummary}"`,
      stream: false,
      options: {
        temperature: 0
      }
    },
    {
      timeout: 30_000
    }
  );

  const parsed = summaryTopicSchema.parse(JSON.parse(extractJsonObject(data.response)));
  return normalizeText(parsed.query);
};

export const detectMemoryCommand = async ({ prompt, model }) => {
  const systemPrompt = `Detect whether user asks to review chat memory/history.
Return JSON only:
{"isMemoryRequest":true|false,"includePreviousChats":true|false}
Rules:
- includePreviousChats=true only if user explicitly asks previous/older chats.`;

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

  const parsed = memoryCommandSchema.parse(JSON.parse(extractJsonObject(data.response)));
  return {
    isMemoryRequest: Boolean(parsed.isMemoryRequest),
    includePreviousChats: Boolean(parsed.includePreviousChats)
  };
};

export const isMeaningfulMapEntity = async ({ entity, prompt, model }) => {
  const systemPrompt = `Decide if entity text is a meaningful map target.
Return JSON only: {"isMeaningful": true|false}
Meaningful examples: "Batam", "Singapore", "Eiffel Tower", "hospital near Batam center"
Not meaningful examples: "map", "on map", "show on map", "di map", empty text.`;

  const { data } = await axios.post(
    `${config.ollamaBaseUrl}/api/generate`,
    {
      model: resolveModel(model),
      prompt: `${systemPrompt}\nPrompt: "${prompt || ""}"\nEntity: "${entity || ""}"`,
      stream: false,
      options: {
        temperature: 0
      }
    },
    {
      timeout: 30_000
    }
  );

  const parsed = mapEntityValiditySchema.parse(JSON.parse(extractJsonObject(data.response)));
  return Boolean(parsed.isMeaningful);
};

const formatMemoryForPrompt = (memoryMessages) => {
  if (!Array.isArray(memoryMessages) || memoryMessages.length === 0) {
    return "";
  }

  return memoryMessages
    .map((message) => {
      const role = message?.role === "assistant" ? "assistant" : "user";
      const text = String(message?.content || "").trim();
      return text ? `${role}: ${text}` : "";
    })
    .filter(Boolean)
    .join("\n");
};

export const askGeneralQuestionWithModel = async (prompt, model, memoryMessages = []) => {
  const systemPrompt =
    "You are a concise helpful assistant. Use conversation memory when relevant. Reply clearly and directly.";
  const memoryBlock = formatMemoryForPrompt(memoryMessages);
  const composedPrompt = memoryBlock
    ? `${systemPrompt}\nConversation memory:\n${memoryBlock}\nUser: ${prompt}`
    : `${systemPrompt}\nUser: ${prompt}`;

  const { data } = await axios.post(
    `${config.ollamaBaseUrl}/api/generate`,
    {
      model: resolveModel(model),
      prompt: composedPrompt,
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

export const summarizeConversation = async ({ previousSummary = "", messages = [], model }) => {
  const summarySeed = normalizeText(previousSummary);
  const messageBlock = formatMemoryForPrompt(messages);
  const systemPrompt = `You summarize chat memory for a software assistant.
Return plain text only (no markdown) with max 6 short lines:
- context:
- preferences:
- last_result:
- open_questions:
Keep it factual and concise.`;

  const prompt = `${systemPrompt}
Previous summary:
${summarySeed || "(none)"}

Recent messages:
${messageBlock || "(none)"}`;

  const { data } = await axios.post(
    `${config.ollamaBaseUrl}/api/generate`,
    {
      model: resolveModel(model),
      prompt,
      stream: false,
      options: {
        temperature: 0.1
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
