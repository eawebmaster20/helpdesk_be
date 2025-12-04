import { Request, Response } from "express";
import {
  insertForm,
  updateFormById,
  getAllSLAPolicies,
  insertSLAPolicy,
  updateSLAPolicyById,
  getAllCategories,
  insertCategory,
  updateCategoryById,
} from "../models/admin.model";

export async function createForm(req: Request, res: Response) {
  const { name, schema } = req.body;
  if (!name || !schema) {
    return res.status(400).json({ message: "Name and schema are required" });
  }
  try {
    const result = await insertForm(name, schema);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function updateForm(req: Request, res: Response) {
  const { id } = req.params;
  const { name, schema } = req.body;
  try {
    const result = await updateFormById(id, name, schema);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Form not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function getSLAPolicies(req: Request, res: Response) {
  try {
    const result = await getAllSLAPolicies();
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function createSLAPolicy(req: Request, res: Response) {
  const { name, description, responseTimeHours, resolutionTimeHours } =
    req.body;
  if (
    !name ||
    responseTimeHours === undefined ||
    resolutionTimeHours === undefined
  ) {
    return res.status(400).json({
      message: "Name, responseTimeHours, and resolutionTimeHours are required",
    });
  }
  try {
    const result = await insertSLAPolicy(
      name,
      description,
      responseTimeHours,
      resolutionTimeHours
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function updateSLAPolicy(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description, responseTimeHours, resolutionTimeHours } =
    req.body;
  try {
    const result = await updateSLAPolicyById(
      id,
      name,
      description,
      responseTimeHours,
      resolutionTimeHours
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "SLA Policy not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function getCategories(req: Request, res: Response) {
  try {
    const result = await getAllCategories();
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function createCategory(req: Request, res: Response) {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }
  try {
    const result = await insertCategory(name, description);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function updateCategory(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const result = await updateCategoryById(id, name, description);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}
