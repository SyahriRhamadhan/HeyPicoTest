import { Router } from "express";
import { handleAssistant, handleMapQuery } from "../controllers/apiController.js";

const apiRouter = Router();

apiRouter.post("/map-query", handleMapQuery);
apiRouter.post("/assistant", handleAssistant);

export default apiRouter;

