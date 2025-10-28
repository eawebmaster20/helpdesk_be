import { Router } from "express";
import {
  getUsers,
  createUser,
  updateUser,
  getL2Users,
} from "../controllers/users.controller";

const router = Router();

// GET /users
router.get("/", getUsers);

// GET USER GROUP /users/level/:id
router.get("/level/:id", getL2Users);

// POST /users
router.post("/", createUser);

// PATCH /users/:id
router.patch("/:id", updateUser);

export default router;
