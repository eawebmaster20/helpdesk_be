import { Request, Response } from "express";
import {
  getDepartmentsModel,
  insertDepartmentModel,
  updateDepartmentModel,
} from "../models/departments.model";

export async function getDepartments(req: Request, res: Response) {
  try {
    const result = await getDepartmentsModel();
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function createDepartment(req: Request, res: Response) {
  const { name, headId } = req.body;
  if (!name) {
    return res.status(400).json({ message: "name is required" });
  }
  try {
    const result = await insertDepartmentModel(name, headId);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function updateDepartment(req: Request, res: Response) {
  const { id } = req.params;
  const { name, headId } = req.body;
  try {
    const result = await updateDepartmentModel(id, name, headId);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Department not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}
