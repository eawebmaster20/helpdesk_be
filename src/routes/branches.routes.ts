import { Router } from "express";
import { createBranch, getBranches, updateBranch } from "../controllers/branches.controller";

const router = Router();

// GET /branches
router.get("/", getBranches);

// POST /branches
router.post("/", createBranch);

// PATCH /branches/:id
router.patch("/:id", updateBranch);

export default router;
