import {
  searchKBArticlesModel,
  updateKBArticleModel,
  getKBArticlesModel,
  createKBArticleModel,
} from "../models/kb.model";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

export async function searchKBArticles(req: Request, res: Response) {
  console.log("request received for Knowledge Base search");
  const { query } = req.query;
  try {
    const result = await searchKBArticlesModel(query as string);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function updateKBArticle(req: Request, res: Response) {
  const { id } = req.params;
  const { title, body, tags } = req.body;
  try {
    const result = await updateKBArticleModel(id, title, body, tags);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "KB Article not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function getKBArticles(req: Request, res: Response) {
  try {
    const result = await getKBArticlesModel();
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function createKBArticle(req: Request, res: Response) {
  const { title, body, tags, createdBy } = req.body;
  if (!title || !body || !createdBy) {
    return res
      .status(400)
      .json({ message: "title, body, and createdBy are required" });
  }
  try {
    const guid = uuidv4();
    const result = await createKBArticleModel(title, body, tags, createdBy, guid);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}
// ...add more KB-related controller functions as needed...
