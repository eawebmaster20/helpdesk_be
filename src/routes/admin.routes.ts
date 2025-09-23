import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  createForm,
  updateForm,
  getSLAPolicies,
  createSLAPolicy,
  updateSLAPolicy,
} from "../controllers/admin.controller";

const router = Router();

// GET /categories
router.get("/categories", getCategories);
// POST /categories
router.post("/categories", createCategory);
// PATCH /categories/:id
router.patch("/categories/:id", updateCategory);

// POST /forms
router.post("/forms", createForm);
// PATCH /forms/:id
router.patch("/forms/:id", updateForm);

// GET /sla-policies
router.get("/sla-policies", getSLAPolicies);
// POST /sla-policies
router.post("/sla-policies", createSLAPolicy);
// PATCH /sla-policies/:id
router.patch("/sla-policies/:id", updateSLAPolicy);

export default router;
