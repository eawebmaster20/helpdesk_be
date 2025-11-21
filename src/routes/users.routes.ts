import { Router } from "express";
import {
  getUsers,
  createUser,
  updateUser,
  getAgents,
  getUserGroup,
} from "../controllers/users.controller";

const router = Router();

// GET /users
router.get("/", getUsers);

// GET USER GROUP /users/level/:id
router.get("/level/:id", getUserGroup);


router.post("/agents", getAgents);

// POST /users
router.post("/", createUser);

// PATCH /users/:id
router.patch("/:id", updateUser);

export default router;
