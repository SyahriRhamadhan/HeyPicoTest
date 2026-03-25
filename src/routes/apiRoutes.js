import { Router } from "express";
import { handleAssistant, handleMapQuery, handleModels } from "../controllers/apiController.js";

const apiRouter = Router();

apiRouter.post("/map-query", handleMapQuery);
apiRouter.post("/assistant", handleAssistant);
apiRouter.get("/models", handleModels);

export default apiRouter;
