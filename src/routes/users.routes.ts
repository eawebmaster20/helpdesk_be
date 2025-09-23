import { Router } from "express";
import {
  getUsers,
  createUser,
  updateUser,
} from "../controllers/users.controller";

const router = Router();

// GET /users
router.get("/users", getUsers);

// POST /users
router.post("/users", createUser);

// PATCH /users/:id
router.patch("/users/:id", updateUser);

export default router;
