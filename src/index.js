import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { config } from "./config.js";
import { searchPlaces } from "./services/mapProvider.js";
import { extractIntent } from "./services/ollama.js";

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

app.use((_req, res) => {
  res.status(404).json({ error: "NotFound" });
});

app.listen(config.port, () => {
  // Keep startup log simple for test environments.
  console.log(`Server running at http://localhost:${config.port}`);
});
