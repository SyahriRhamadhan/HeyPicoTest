import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 3001),
  defaultLocation: process.env.DEFAULT_LOCATION ?? "Batam",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  ollamaModel: process.env.OLLAMA_MODEL ?? "qwen2.5-coder:7b",
  mapProvider: process.env.MAP_PROVIDER ?? "auto",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  osmUserAgent: process.env.OSM_USER_AGENT ?? "mapai/1.0",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 30),
  maxRecommendations: Number(process.env.MAX_RECOMMENDATIONS ?? 1)
};
