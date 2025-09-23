import { Router } from "express";
import {
  searchKBArticles,
  createKBArticle,
  updateKBArticle,
} from "../controllers/kb.controller";

const router = Router();

// GET /kb
router.get("/", searchKBArticles);

// POST /kb
router.post("/", createKBArticle);

// PATCH /kb/:id
router.patch("/:id", updateKBArticle);

export default router;
