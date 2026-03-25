import { Router } from "express";
import {
  handleAssistant,
  handleClearMemory,
  handleChatMessages,
  handleCreateChat,
  handleDeleteChat,
  handleListChats,
  handleMapQuery,
  handleModels,
  handleUpdateChat
} from "../controllers/apiController.js";

const apiRouter = Router();

apiRouter.post("/map-query", handleMapQuery);
apiRouter.post("/assistant", handleAssistant);
apiRouter.get("/models", handleModels);
apiRouter.post("/chats", handleCreateChat);
apiRouter.get("/chats", handleListChats);
apiRouter.patch("/chats/:chatId", handleUpdateChat);
apiRouter.delete("/chats/:chatId", handleDeleteChat);
apiRouter.get("/chats/:chatId/messages", handleChatMessages);
apiRouter.post("/memory/clear", handleClearMemory);

export default apiRouter;
