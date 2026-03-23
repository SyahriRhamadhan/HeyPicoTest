import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { config } from "./config.js";
import { searchPlaces } from "./services/mapProvider.js";
import { askGeneralQuestion, extractIntent } from "./services/ollama.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use(
  "/api",
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false
  })
);

const promptSchema = z.object({
  prompt: z.string().min(5).max(500)
});

const isMapIntentPrompt = (prompt) => {
  const text = prompt.toLowerCase();

  return /(find|search|where|lokasi|cari|maps|map|near|dekat|restaurant|cafe|coffee|hotel|beach|pantai|direction|rute|route)/.test(
    text
  );
};

const hasExplicitLocationInPrompt = (prompt) => /\b(in|di)\s+[a-zA-Z\s]+$/i.test(prompt.trim());

const needsClarification = ({ prompt, query }) => {
  const normalizedQuery = String(query || "")
    .toLowerCase()
    .trim();
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  const genericTerms = new Set([
    "tempat",
    "place",
    "lokasi",
    "location",
    "makan",
    "eat",
    "food",
    "restaurant",
    "coffee",
    "cafe",
    "hotel",
    "wisata",
    "tourist",
    "attraction"
  ]);

  const isTooGeneric = tokens.length <= 2 && tokens.some((token) => genericTerms.has(token));
  const hasExplicitLocation = hasExplicitLocationInPrompt(prompt);

  return isTooGeneric && !hasExplicitLocation;
};

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "heypico-test-backend",
    mapProvider: config.mapProvider
  });
});

app.post("/api/map-query", async (req, res) => {
  try {
    const { prompt } = promptSchema.parse(req.body);
    const intent = await extractIntent(prompt);

    if (needsClarification({ prompt, query: intent.query })) {
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

    res.json({
      prompt,
      intent,
      ...mapsResult
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "ValidationError",
        details: error.issues
      });
    }

    return res.status(500).json({
      error: "InternalServerError",
      message: error.message
    });
  }
});

app.post("/api/assistant", async (req, res) => {
  try {
    const { prompt } = promptSchema.parse(req.body);

    if (!isMapIntentPrompt(prompt)) {
      const answer = await askGeneralQuestion(prompt);
      return res.json({
        mode: "chat",
        prompt,
        answer
      });
    }

    const intent = await extractIntent(prompt);

    if (needsClarification({ prompt, query: intent.query })) {
      return res.json({
        mode: "map",
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

    return res.json({
      mode: "map",
      prompt,
      intent,
      ...mapsResult
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "ValidationError",
        details: error.issues
      });
    }

    return res.status(500).json({
      error: "InternalServerError",
      message: error.message
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "NotFound" });
});

app.listen(config.port, () => {
  // Keep startup log simple for test environments.
  console.log(`Server running at http://localhost:${config.port}`);
});
