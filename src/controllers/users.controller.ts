import { Request, Response } from "express";
import {
  getUserGroupModel,
  getUsersModel,
  insertUserModel,
  updateUserModel,
} from "../models/users.model";

export async function getUsers(req: Request, res: Response) {
  try {
    const result = await getUsersModel();
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function getL2Users(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await getUserGroupModel(id);
    res.json({
      data: result.rows,
      message: 'Users retrieved successfully',
      status: 'success'
    });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function createUser(req: Request, res: Response) {
  const { name, email, role, departmentId } = req.body;
  if (!name || !email || !role) {
    return res
      .status(400)
      .json({ message: "name, email, and role are required" });
  }
  try {
    const result = await insertUserModel(name, email, role, departmentId);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { name, email, role, departmentId } = req.body;
  try {
    const result = await updateUserModel(id, name, email, role, departmentId);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}
