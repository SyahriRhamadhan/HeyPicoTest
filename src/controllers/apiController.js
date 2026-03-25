import { ZodError } from "zod";
import { reverseGeocode, searchEntityOnMap, searchPlaces } from "../services/mapProvider.js";
import {
  askGeneralQuestionWithModel,
  classifyMapQueryMode,
  detectMemoryCommand,
  extractIntent,
  extractMapEntity,
  extractMapEntityFromPrompt,
  extractQueryFromSummary,
  isMeaningfulMapEntity,
  isCurrentLocationIntent,
  listLocalModels,
  planAssistantAction,
  shouldClarifyMapSearch,
  shouldUsePreviousMapContext,
  summarizeConversation
} from "../services/ollama.js";
import { promptSchema } from "../schemas/promptSchema.js";
import { logger } from "../utils/logger.js";
import {
  buildMapAssistantMessage,
  limitRecommendations,
  resolveLocationForSearch,
  sortPlacesByBrowserLocation,
  toEmbedUrlFromLatLng,
  toMapsSearchUrlFromLatLng
} from "../utils/mapAssistantHelpers.js";
import {
  appendChatMessage,
  clearAllChats,
  clearChatById,
  createChatSession,
  ensureChatSession,
  getChatMessages,
  getChatMessageCount,
  getChatSummary,
  getRecentMessagesAcrossChats,
  getRecentChatMessages,
  listChatSessions,
  upsertChatSummary
} from "../services/chatStore.js";

const SUMMARY_MESSAGE_INTERVAL = 6;

const fallbackPlannerAction = () => ({
  action: "chat",
  query: "",
  location: "",
  placeType: "place",
  mapEntity: ""
});

const parseMessageMeta = (meta) => {
  if (!meta) return null;
  if (typeof meta === "object") return meta;
  if (typeof meta !== "string") return null;
  try {
    return JSON.parse(meta);
  } catch {
    return null;
  }
};

const getLastMapContext = (messages = []) => {
  for (const message of messages) {
    if (message.role !== "assistant") continue;
    const meta = parseMessageMeta(message.meta);
    if (!meta || meta.type !== "map_result") continue;
    return {
      query: String(meta.requestQuery || "").trim(),
      location: String(meta.location || "").trim(),
      placeType: String(meta.placeType || "").trim()
    };
  }
  return null;
};


const buildMemoryAssistantMessage = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) return "No memory found in this chat yet.";
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  if (!lastUser?.content) return "No readable memory found in this chat yet.";
  return `Last user request: ${String(lastUser.content).trim()}`;
};

const buildCrossChatMemoryAssistantMessage = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return "No previous-chat memory found.";
  }

  const lines = messages
    .slice(-8)
    .map((message, index) => {
      const role = message.role === "assistant" ? "Assistant" : "You";
      const chatTitle = message?.chat?.title || "Untitled chat";
      return `${index + 1}. [${chatTitle}] ${role}: ${String(message.content || "").trim()}`;
    })
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return "No readable previous-chat memory found.";
  }

  return `Here is memory from previous chats:\n${lines.join("\n")}`;
};

const toModelMemory = (messages = [], { includeChatTitle = false } = {}) => {
  return messages
    .map((message) => {
      const role = message.role === "assistant" ? "assistant" : "user";
      const content = String(message.content || "").trim();
      if (!content) return null;
      if (includeChatTitle) {
        const title = message?.chat?.title || "untitled";
        return { role, content: `[chat:${title}] ${content}` };
      }
      return { role, content };
    })
    .filter(Boolean);
};

const truncateLine = (value, max = 140) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
};

const buildSummaryFallback = (messages = []) => {
  const recent = messages.slice(-10);
  const lastUser = [...recent].reverse().find((message) => message.role === "user");
  const lastAssistant = [...recent].reverse().find((message) => message.role === "assistant");
  const context = lastUser ? truncateLine(lastUser.content) : "n/a";
  const result = lastAssistant ? truncateLine(lastAssistant.content) : "n/a";
  return `context: ${context}\npreferences: n/a\nlast_result: ${result}\nopen_questions: n/a`;
};

const shouldRefreshSummary = (totalMessageCount, currentSummary, force = false) => {
  if (force) return true;
  if (!currentSummary) return true;
  const sourceCount = Number(currentSummary.sourceMessageCount || 0);
  return totalMessageCount - sourceCount >= SUMMARY_MESSAGE_INTERVAL;
};

const refreshChatSummaryIfNeeded = async ({ chatId, model, force = false }) => {
  const totalMessageCount = await getChatMessageCount(chatId);
  if (totalMessageCount === 0) return null;

  const currentSummary = await getChatSummary(chatId);
  if (!shouldRefreshSummary(totalMessageCount, currentSummary, force)) {
    return currentSummary;
  }

  const recentMessages = [...(await getRecentChatMessages(chatId, 14))].reverse();
  let summaryText = "";

  try {
    summaryText = await summarizeConversation({
      previousSummary: currentSummary?.summary || "",
      messages: recentMessages,
      model
    });
  } catch (error) {
    logger.warn("Summary generation failed, using fallback summary", { message: error.message });
    summaryText = "";
  }

  const safeSummary = truncateLine(summaryText, 1200) || buildSummaryFallback(recentMessages);
  return upsertChatSummary({
    chatId,
    summary: safeSummary,
    sourceMessageCount: totalMessageCount
  });
};

const sendError = (res, error) => {
  if (error instanceof ZodError) {
    logger.warn("Validation error", { issues: error.issues });
    return res.status(400).json({
      error: "ValidationError",
      details: error.issues
    });
  }

  logger.error("Unhandled API error", { message: error.message, stack: error.stack });
  return res.status(500).json({
    error: "InternalServerError",
    message: error.message
  });
};

const buildAssistantMeta = (payload) => {
  if (!payload || payload.mode !== "map") {
    return null;
  }

  return {
    type: "map_result",
    mode: payload.mode,
    provider: payload.provider || null,
    requestQuery: payload.requestQuery || null,
    location: payload?.intent?.location || null,
    placeType: payload?.intent?.placeType || null,
    totalResults: Number(payload.totalResults || 0),
    places: Array.isArray(payload.places) ? payload.places : [],
    selectedPlaceIndex: 0
  };
};

const sendAssistantResponse = async ({ res, payload, chatSessionId, userPrompt, model }) => {
  if (chatSessionId) {
    await appendChatMessage({
      chatId: chatSessionId,
      role: "user",
      content: userPrompt
    });
    await appendChatMessage({
      chatId: chatSessionId,
      role: "assistant",
      content: payload.assistantMessage || payload.answer || "",
      meta: buildAssistantMeta(payload)
    });

    await refreshChatSummaryIfNeeded({
      chatId: chatSessionId,
      model
    });
  }

  return res.json({
    ...payload,
    chatId: chatSessionId || null
  });
};

export const handleMapQuery = async (req, res) => {
  try {
    const { prompt, browserLocation, model } = promptSchema.parse(req.body);
    const intent = await extractIntent(prompt, model);

    const clarify = await shouldClarifyMapSearch({
      prompt,
      query: intent.query,
      location: intent.location,
      hasBrowserLocation: Boolean(browserLocation),
      model
    });

    if (clarify.needsClarification) {
      return res.json({
        prompt,
        intent,
        needsClarification: true,
        clarificationQuestion:
          clarify.clarificationQuestion ||
          "Please specify the city or area first. Example: 'find coffee shops in Batam' or 'find beach in Nongsa Batam'."
      });
    }

    const mapsResult = await searchPlaces({
      query: intent.query,
      location: intent.location,
      placeType: intent.placeType
    });
    const limitedPlaces = limitRecommendations(mapsResult.places);

    return res.json({
      prompt,
      intent,
      ...mapsResult,
      totalResults: limitedPlaces.length,
      places: limitedPlaces
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const buildCurrentLocationResponse = async ({ prompt, browserLocation }) => {
  if (!browserLocation) {
    return {
      mode: "chat",
      prompt,
      assistantMessage:
        "I can't read your current location yet. Click 'Use Location' first, then ask again."
    };
  }

  const { lat, lng } = browserLocation;
  let address = "";
  try {
    const geocode = await reverseGeocode({ lat, lng });
    address = String(geocode?.address || "").trim();
  } catch {
    address = "";
  }

  const locationText = address
    ? `Your current location is around ${address} (lat ${lat}, lng ${lng}).`
    : `Your current location is approximately lat ${lat}, lng ${lng}.`;

  return {
    mode: "chat",
    prompt,
    assistantMessage: locationText,
    location: browserLocation,
    address: address || null,
    mapsUrl: toMapsSearchUrlFromLatLng(lat, lng)
  };
};

const buildCurrentLocationMapResponse = async ({ prompt, browserLocation }) => {
  if (!browserLocation) {
    return {
      mode: "map",
      prompt,
      needsClarification: true,
      assistantMessage: "Please click 'Use Location' first, then I can pin your location on the map."
    };
  }

  const { lat, lng } = browserLocation;
  let address = "";
  try {
    const geocode = await reverseGeocode({ lat, lng });
    address = String(geocode?.address || "").trim();
  } catch {
    address = "";
  }
  return {
    mode: "map",
    prompt,
    provider: "browser",
    requestQuery: "current_location",
    totalResults: 1,
    places: [
      {
        name: "Your Current Location",
        formattedAddress: address || `Lat ${lat}, Lng ${lng}`,
        rating: null,
        location: { lat, lng },
        mapsUrl: toMapsSearchUrlFromLatLng(lat, lng),
        embedUrl: toEmbedUrlFromLatLng(lat, lng)
      }
    ],
    assistantMessage: "Done. I pinned your current location on the map.",
    usedBrowserLocation: true
  };
};

export const handleAssistant = async (req, res) => {
  try {
    const { prompt, browserLocation, model, chatId } = promptSchema.parse(req.body);
    const chatSession = await ensureChatSession(chatId);
    const recentMessages = await getRecentChatMessages(chatSession.id, 12);
    const currentSummary = await getChatSummary(chatSession.id);
    const memoryDecision = await detectMemoryCommand({ prompt, model }).catch(() => ({
      isMemoryRequest: false,
      includePreviousChats: false
    }));
    const crossChatMessages = memoryDecision.includePreviousChats
      ? await getRecentMessagesAcrossChats({ excludeChatId: chatSession.id, limit: 10 })
      : [];
    const llmMemory = [
      ...(currentSummary?.summary
        ? [{ role: "assistant", content: `[summary] ${currentSummary.summary}` }]
        : []),
      ...toModelMemory([...recentMessages].reverse()),
      ...toModelMemory([...crossChatMessages].reverse(), { includeChatTitle: true })
    ];
    const respond = (payload) =>
      sendAssistantResponse({
        res,
        payload,
        chatSessionId: chatSession.id,
        userPrompt: prompt,
        model
      });

    if (memoryDecision.isMemoryRequest) {
      const ensuredSummary = await refreshChatSummaryIfNeeded({
        chatId: chatSession.id,
        model,
        force: !currentSummary
      });
      const chronological = [...recentMessages].reverse();
      const crossChronological = [...crossChatMessages].reverse();
      const baseMemoryText = buildMemoryAssistantMessage(chronological);
      const summaryText = ensuredSummary?.summary
        ? `Saved summary:\n${ensuredSummary.summary}`
        : "Saved summary: (not generated yet)";
      if (!memoryDecision.includePreviousChats) {
        return respond({
          mode: "chat",
          prompt,
          model: model || null,
          assistantMessage: `${summaryText}\n\n${baseMemoryText}`
        });
      }
      return respond({
        mode: "chat",
        prompt,
        model: model || null,
        assistantMessage: `${summaryText}\n\n${baseMemoryText}\n\n${buildCrossChatMemoryAssistantMessage(crossChronological)}`
      });
    }
    let plannedAction;

    try {
      plannedAction = await planAssistantAction({
        prompt,
        hasBrowserLocation: Boolean(browserLocation),
        model
      });
    } catch {
      logger.warn("Planner failed, using fallback action");
      plannedAction = fallbackPlannerAction();
    }
    const intent = await extractIntent(prompt, model).catch(() => ({
      query: prompt,
      location: "",
      placeType: "place"
    }));
    const lastMapContext = getLastMapContext(recentMessages);

    if (plannedAction.action === "current_location") {
      const confirmedSelfLocation = await isCurrentLocationIntent({ prompt, model }).catch(() => false);
      const inferredQuery = plannedAction.query || intent.query || lastMapContext?.query || prompt;
      const inferredLocation = plannedAction.location || intent.location || lastMapContext?.location || "";
      const inferredPlaceType = plannedAction.placeType || intent.placeType || lastMapContext?.placeType || "place";

      if (!confirmedSelfLocation && inferredLocation) {
        plannedAction = {
          ...plannedAction,
          action: "map_search",
          query: inferredQuery,
          location: inferredLocation,
          placeType: inferredPlaceType
        };
      } else {
        return respond(await buildCurrentLocationResponse({ prompt, browserLocation }));
      }
    }

    if (plannedAction.action === "current_location_map") {
      const isSelfLocationPrompt = await isCurrentLocationIntent({ prompt, model });
      if (!isSelfLocationPrompt) {
        const entity = plannedAction.mapEntity || (await extractMapEntityFromPrompt({ prompt, model }));
        plannedAction = {
          ...plannedAction,
          action: "map_search",
          query: entity || prompt,
          location: "",
          mapEntity: entity
        };
      } else {
        return respond(await buildCurrentLocationMapResponse({ prompt, browserLocation }));
      }
    }

    if (plannedAction.action === "chat") {
      const answer = await askGeneralQuestionWithModel(prompt, model, llmMemory);
      return respond({
        mode: "chat",
        prompt,
        model: model || null,
        answer,
        assistantMessage: answer
      });
    }

    if (plannedAction.action === "answer_and_map") {
      const answer = await askGeneralQuestionWithModel(prompt, model, llmMemory);
      const mapEntity =
        plannedAction.mapEntity ||
        (await extractMapEntity({
          prompt,
          answer,
          model
        }));
      const meaningfulEntity = mapEntity
        ? await isMeaningfulMapEntity({ entity: mapEntity, prompt, model }).catch(() => false)
        : false;

      if (!mapEntity || !meaningfulEntity) {
        if (browserLocation && (await isCurrentLocationIntent({ prompt, model }))) {
          return respond(await buildCurrentLocationMapResponse({ prompt, browserLocation }));
        }
        return respond({
          mode: "chat",
          prompt,
          model: model || null,
          answer,
          assistantMessage: answer
        });
      }

      const mapResult = await searchEntityOnMap({ query: mapEntity });
      return respond({
        mode: "map",
        prompt,
        model: model || null,
        provider: mapResult.provider,
        requestQuery: mapResult.requestQuery,
        totalResults: mapResult.totalResults,
        places: mapResult.places,
        assistantMessage: `${answer}\n\nI pinned ${mapEntity} on the map.`,
        usedBrowserLocation: false
      });
    }

    let mapQuery = plannedAction.query || intent.query || prompt;
    let mapPlaceType = plannedAction.placeType || intent.placeType;
    let mapLocation = plannedAction.location || intent.location || "";

    let usePreviousContext = false;
    try {
      usePreviousContext = await shouldUsePreviousMapContext({
        prompt,
        previousQuery: lastMapContext?.query || "",
        summary: currentSummary?.summary || "",
        model
      });
    } catch {
      usePreviousContext = false;
    }

    if (usePreviousContext) {
      if (lastMapContext?.query) mapQuery = lastMapContext.query;
      else {
        const topicFromSummary = await extractQueryFromSummary({
          summary: currentSummary?.summary || "",
          model
        });
        if (topicFromSummary) mapQuery = topicFromSummary;
      }
      if (!mapLocation && lastMapContext?.location) mapLocation = lastMapContext.location;
      if (!mapPlaceType && lastMapContext?.placeType) mapPlaceType = lastMapContext.placeType;
    }

    const mapQueryMode = await classifyMapQueryMode({ prompt, query: mapQuery, model });

    if (mapQueryMode === "entity") {
      const entity = plannedAction.mapEntity || mapQuery;
      const mapResult = await searchEntityOnMap({ query: entity });
      return respond({
        mode: "map",
        prompt,
        model: model || null,
        provider: mapResult.provider,
        requestQuery: mapResult.requestQuery,
        totalResults: mapResult.totalResults,
        places: mapResult.places,
        assistantMessage: `I pinned ${entity} on the map.`,
        usedBrowserLocation: false
      });
    }

    const clarify = await shouldClarifyMapSearch({
      prompt,
      query: mapQuery,
      location: mapLocation,
      hasBrowserLocation: Boolean(browserLocation),
      model
    });

    if (clarify.needsClarification && !mapLocation && !browserLocation) {
      return respond({
        mode: "map",
        prompt,
        intent,
        needsClarification: true,
        clarificationQuestion:
          clarify.clarificationQuestion ||
          "Please specify the city or area first. Example: 'find coffee shops in Batam' or 'find beach in Nongsa Batam'.",
        assistantMessage:
          clarify.clarificationQuestion ||
          "I need a little more context first. Which city or area should I search in?"
      });
    }

    const resolvedLocation = resolveLocationForSearch({
      intentLocation: mapLocation,
      browserLocation
    });

    const mapsResult = await searchPlaces({
      query: mapQuery,
      location: resolvedLocation,
      placeType: mapPlaceType
    });
    const rankedPlaces = sortPlacesByBrowserLocation(mapsResult.places ?? [], browserLocation);
    const limitedPlaces = limitRecommendations(rankedPlaces);
    const assistantMessage = buildMapAssistantMessage({
      totalResults: limitedPlaces.length,
      location: browserLocation && !mapLocation ? "your current area" : resolvedLocation,
      query: mapQuery,
      usedBrowserLocation: Boolean(browserLocation)
    });

    return respond({
      mode: "map",
      prompt,
      model: model || null,
      intent,
      ...mapsResult,
      totalResults: limitedPlaces.length,
      places: limitedPlaces,
      assistantMessage,
      usedBrowserLocation: Boolean(browserLocation),
      nextActions: [
        "Ask for another category in the same area",
        "Use browser location to rank nearest places"
      ]
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const handleModels = async (_req, res) => {
  try {
    const models = await listLocalModels();
    return res.json({ models });
  } catch (error) {
    return sendError(res, error);
  }
};

export const handleCreateChat = async (req, res) => {
  try {
    const requestedTitle = String(req.body?.title || "").trim();
    const chat = await createChatSession(requestedTitle || "New chat");
    return res.json(chat);
  } catch (error) {
    return sendError(res, error);
  }
};

export const handleListChats = async (_req, res) => {
  try {
    const chats = await listChatSessions();
    return res.json({
      chats: chats.map((chat) => ({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }))
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const handleChatMessages = async (req, res) => {
  try {
    const chatId = String(req.params.chatId || "");
    if (!chatId) {
      return res.status(400).json({ error: "ValidationError", message: "chatId is required" });
    }

    const messages = await getChatMessages(chatId);
    return res.json({
      chatId,
      messages: messages.map((message) => ({
        id: message.id,
        role: message.role,
        text: message.content,
        meta: (() => {
          if (!message.meta) return undefined;
          try {
            return JSON.parse(message.meta);
          } catch {
            return message.meta;
          }
        })(),
        createdAt: message.createdAt
      }))
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const handleClearMemory = async (req, res) => {
  try {
    const scope = String(req.body?.scope || "all");
    const chatId = String(req.body?.chatId || "");

    if (scope === "current") {
      if (!chatId) {
        return res.status(400).json({
          error: "ValidationError",
          message: "chatId is required when scope is current"
        });
      }
      const result = await clearChatById(chatId);
      return res.json({
        scope,
        ...result
      });
    }

    const result = await clearAllChats();
    return res.json({
      scope: "all",
      ...result
    });
  } catch (error) {
    return sendError(res, error);
  }
};
