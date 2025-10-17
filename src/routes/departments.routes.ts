import { Router } from "express";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
} from "../controllers/departments.controller";

const router = Router();

// GET /departments
router.get("/", getDepartments);

// POST /departments
router.post("/", createDepartment);

// PATCH /departments/:id
router.patch("/:id", updateDepartment);

export default router;
