import { Router } from "express";
import streamsRouter from "./streams";

const router = Router();
router.use("/streams", streamsRouter);

export default router;
