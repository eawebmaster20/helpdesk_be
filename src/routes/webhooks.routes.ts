import { Router } from "express";
import {
  outboundWebhook,
  getOutboundLog,
} from "../controllers/webhooks.controller";

const router = Router();

// POST /webhooks/outbound
router.post("/outbound", outboundWebhook);

// GET /webhooks/outbound/log
router.get("/outbound/log", getOutboundLog);

export default router;
