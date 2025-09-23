import { Router } from "express";
import {
  createApprovals,
  decideApproval,
} from "../controllers/approvals.controller";

const router = Router();

// POST /tickets/:id/approvals
router.post("/tickets/:id/approvals", createApprovals);

// POST /approvals/:id/decision
router.post("/approvals/:id/decision", decideApproval);

export default router;
