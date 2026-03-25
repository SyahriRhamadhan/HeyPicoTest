import { ZodError } from "zod";
import { searchEntityOnMap, searchPlaces } from "../services/mapProvider.js";
import {
  askGeneralQuestionWithModel,
  classifyMapQueryMode,
  extractIntent,
  extractMapEntity,
  extractMapEntityFromPrompt,
  isCurrentLocationIntent,
  listLocalModels,
  planAssistantAction
} from "../services/ollama.js";
import { promptSchema } from "../schemas/promptSchema.js";
import { logger } from "../utils/logger.js";
import {
  buildMapAssistantMessage,
  hasExplicitLocationInPrompt,
  isMapIntentPrompt,
  limitRecommendations,
  needsClarification,
  resolveLocationForSearch,
  sortPlacesByBrowserLocation,
  toEmbedUrlFromLatLng,
  toMapsSearchUrlFromLatLng
} from "../utils/mapAssistantHelpers.js";

const fallbackPlannerAction = (prompt) => ({
  action: isMapIntentPrompt(prompt) ? "map_search" : "chat",
  query: "",
  location: "",
  placeType: "place",
  mapEntity: ""
});

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

export const handleMapQuery = async (req, res) => {
  try {
    const { prompt, browserLocation, model } = promptSchema.parse(req.body);
    const intent = await extractIntent(prompt, model);

    if (needsClarification({ prompt, query: intent.query, browserLocation })) {
      return res.json({
        prompt,
        intent,
        needsClarification: true,
        clarificationQuestion:
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

const buildCurrentLocationResponse = ({ prompt, browserLocation }) => {
  if (!browserLocation) {
    return {
      mode: "chat",
      prompt,
      assistantMessage:
        "I can't read your current location yet. Click 'Use Location' first, then ask again."
    };
  }

  return {
    mode: "chat",
    prompt,
    assistantMessage: `Your current location is approximately lat ${browserLocation.lat}, lng ${browserLocation.lng}.`,
    location: browserLocation,
    mapsUrl: toMapsSearchUrlFromLatLng(browserLocation.lat, browserLocation.lng)
  };
};

const buildCurrentLocationMapResponse = ({ prompt, browserLocation }) => {
  if (!browserLocation) {
    return {
      mode: "map",
      prompt,
      needsClarification: true,
      assistantMessage: "Please click 'Use Location' first, then I can pin your location on the map."
    };
  }

  const { lat, lng } = browserLocation;
  return {
    mode: "map",
    prompt,
    provider: "browser",
    requestQuery: "current_location",
    totalResults: 1,
    places: [
      {
        name: "Your Current Location",
        formattedAddress: `Lat ${lat}, Lng ${lng}`,
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
    const { prompt, browserLocation, model } = promptSchema.parse(req.body);
    let plannedAction;

    try {
      plannedAction = await planAssistantAction({
        prompt,
        hasBrowserLocation: Boolean(browserLocation),
        model
      });
    } catch {
      logger.warn("Planner failed, using fallback action");
      plannedAction = fallbackPlannerAction(prompt);
    }

    if (plannedAction.action === "current_location") {
      return res.json(buildCurrentLocationResponse({ prompt, browserLocation }));
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
      return res.json(buildCurrentLocationMapResponse({ prompt, browserLocation }));
      }
    }

    if (plannedAction.action === "chat") {
      const answer = await askGeneralQuestionWithModel(prompt, model);
      return res.json({
        mode: "chat",
        prompt,
        model: model || null,
        answer,
        assistantMessage: answer
      });
    }

    if (plannedAction.action === "answer_and_map") {
      const answer = await askGeneralQuestionWithModel(prompt, model);
      const mapEntity =
        plannedAction.mapEntity ||
        (await extractMapEntity({
          prompt,
          answer,
          model
        }));

      if (!mapEntity) {
        return res.json({
          mode: "chat",
          prompt,
          model: model || null,
          answer,
          assistantMessage: answer
        });
      }

      const mapResult = await searchEntityOnMap({ query: mapEntity });
      return res.json({
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

    const intent = await extractIntent(prompt, model);
    const hasExplicitLocation = hasExplicitLocationInPrompt(prompt);
    const mapQuery = plannedAction.query || intent.query || prompt;
    const mapPlaceType = plannedAction.placeType || intent.placeType;
    const mapLocation = plannedAction.location || (hasExplicitLocation ? intent.location : "") || "";
    const mapQueryMode = await classifyMapQueryMode({ prompt, query: mapQuery, model });

    if (mapQueryMode === "entity") {
      const entity = plannedAction.mapEntity || mapQuery;
      const mapResult = await searchEntityOnMap({ query: entity });
      return res.json({
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

    if (!browserLocation && !mapLocation) {
      return res.json({
        mode: "map",
        prompt,
        intent,
        needsClarification: true,
        clarificationQuestion:
          "Please specify the city or area first. Example: 'find coffee shops in Batam' or 'find beach in Nongsa Batam'.",
        assistantMessage:
          "I need a little more context first. Which city or area should I search in?"
      });
    }

    if (needsClarification({ prompt, query: mapQuery, browserLocation })) {
      return res.json({
        mode: "map",
        prompt,
        intent,
        needsClarification: true,
        clarificationQuestion:
          "Please specify the city or area first. Example: 'find coffee shops in Batam' or 'find beach in Nongsa Batam'.",
        assistantMessage:
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
      location: browserLocation && !hasExplicitLocation ? "your current area" : resolvedLocation,
      query: mapQuery,
      usedBrowserLocation: Boolean(browserLocation)
    });

    return res.json({
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
