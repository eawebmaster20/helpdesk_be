import { Router } from "express";
import {
  getUsers,
  createUser,
  updateUser,
} from "../controllers/users.controller";

const router = Router();

// GET /users
router.get("/", getUsers);

// POST /users
router.post("/", createUser);

// PATCH /users/:id
router.patch("/:id", updateUser);

export default router;
