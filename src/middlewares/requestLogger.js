import { logger } from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    logger.info("HTTP request", {
      method,
      path: originalUrl,
      status: res.statusCode,
      durationMs
    });
  });

  next();
};

