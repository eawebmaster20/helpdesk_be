import { Request, Response } from "express";
import { getBranchesModel, insertBranchModel, updateBranchModel } from "../models/branches.model";

export async function getBranches(req: Request, res: Response) {
  try {
    const result = await getBranchesModel();
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function createBranch(req: Request, res: Response) {
  const { name, headId } = req.body;
  if (!name) {
    return res.status(400).json({ message: "name is required" });
  }
  try {
    const result = await insertBranchModel(name, headId);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function updateBranch(req: Request, res: Response) {
  const { id } = req.params;
  const { name, headId } = req.body;
  try {
    const result = await updateBranchModel(id, name, headId);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Branch not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}
