import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai";
import vocalCoachRouter from "./vocal-coach";

const router: IRouter = Router();

router.use(healthRouter);
router.use(openaiRouter);
router.use(vocalCoachRouter);

export default router;
