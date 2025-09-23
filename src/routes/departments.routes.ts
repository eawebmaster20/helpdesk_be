import { Router } from "express";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
} from "../controllers/departments.controller";

const router = Router();

// GET /departments
router.get("/departments", getDepartments);

// POST /departments
router.post("/departments", createDepartment);

// PATCH /departments/:id
router.patch("/departments/:id", updateDepartment);

export default router;
