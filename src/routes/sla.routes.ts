import { Router } from "express";
import { createBulkSLApolicies, createSLAPolicy, deleteSLAPolicyById, getAllSLAPolicies, updateSLAPolicy } from "../controllers/sla.controller";

const router = Router();

router.get("/", getAllSLAPolicies);

// router.get("/:ticketId/:priorityId/compliance", testFunction);

router.post("/", createSLAPolicy);

router.post("/bulk", createBulkSLApolicies);

router.delete("/:id", deleteSLAPolicyById);

router.patch("/:id", updateSLAPolicy);

export default router;