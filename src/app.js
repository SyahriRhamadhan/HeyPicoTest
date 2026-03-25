import cors from "cors";
import express from "express";
import path from "path";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import apiRouter from "./routes/apiRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.static(path.join(__dirname, "../public")));
  app.use(requestLogger);

  app.use(
    "/api",
    rateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.rateLimitMaxRequests,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "mapai-backend",
      mapProvider: config.mapProvider,
      maxRecommendations: config.maxRecommendations
    });
  });

  app.use("/api", apiRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "NotFound" });
  });

  return app;
};
