import { Router } from "express";
import { createSLAPolicy, deleteSLAPolicyById, getAllSLAPolicies, updateSLAPolicy } from "../controllers/sla.controller";

const router = Router();

router.get("/", getAllSLAPolicies);

router.post("/", createSLAPolicy);

router.delete("/:id", deleteSLAPolicyById);

router.patch("/:id", updateSLAPolicy);

export default router;