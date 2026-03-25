import { createApp } from "./app.js";
import { config } from "./config.js";
import { initChatSchema } from "./db/prisma.js";
import { logger } from "./utils/logger.js";

const app = createApp();

const bootstrap = async () => {
  await initChatSchema();
  app.listen(config.port, () => {
    logger.info("Server started", { url: `http://localhost:${config.port}` });
  });
};

bootstrap().catch((error) => {
  logger.error("Failed to bootstrap server", { message: error.message, stack: error.stack });
  process.exit(1);
});
