import { db } from "../db";
import { Request, Response } from "express";

// Ticket Categories
export async function createTicketCategory(req: Request, res: Response) {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ message: "name is required" });
  }
  try {
    const result = await db.query(
      `INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *`,
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function createBulkTicketCategories(req: Request, res: Response) {
  const categories = req.body.categories;
  if (!Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ message: "categories array is required" });
  }
  try {
    await db.query("BEGIN");
    const insertPromises = categories.map((category: any) => {
      const { name, description } = category;
      return db.query(
        `INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *`,
        [name, description]
      );
    });
    const results = await Promise.all(insertPromises);
    await db.query("COMMIT");
    res.status(201).json(results.map((r) => r.rows[0]));
  } catch (err) {
    await db.query("ROLLBACK");
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function getTicketCategories(req: Request, res: Response) {
  try {
    const result = await db.query("SELECT * FROM categories");
    res.json({
        data: result.rows,
        message: 'Categories retrieved successfully',
        status: 'success'
    });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function updateTicketCategory(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description } = req.body;
    if (!name) {
    return res.status(400).json({ message: "name is required" });
  }
  try {
    const result = await db.query(
      `UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *`,
      [name, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
};
export async function deleteTicketCategory(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await db.query(
      `DELETE FROM categories WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
};