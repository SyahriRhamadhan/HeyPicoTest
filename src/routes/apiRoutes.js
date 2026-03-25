import { Router } from "express";
import {
  handleAssistant,
  handleClearMemory,
  handleChatMessages,
  handleCreateChat,
  handleListChats,
  handleMapQuery,
  handleModels
} from "../controllers/apiController.js";

const apiRouter = Router();

apiRouter.post("/map-query", handleMapQuery);
apiRouter.post("/assistant", handleAssistant);
apiRouter.get("/models", handleModels);
apiRouter.post("/chats", handleCreateChat);
apiRouter.get("/chats", handleListChats);
apiRouter.get("/chats/:chatId/messages", handleChatMessages);
apiRouter.post("/memory/clear", handleClearMemory);

export default apiRouter;
