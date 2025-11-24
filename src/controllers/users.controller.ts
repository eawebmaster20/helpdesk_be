import { Request, Response } from "express";
import {
  getUserGroupModel,
  getUsersModel,
  insertUserModel,
  updateUserModel,
} from "../models/users.model";
import { pushUserListUpdateToAdminDashboard } from "../websockets/ticket.socket";
import { appLogger } from "../utils/logger";

export async function getUsers(req: Request, res: Response) {
  try {
    const result = await getUsersModel();
    res.json({
      data:result.rows,
      message: 'Users retrieved successfully',
      status: 'success'
    });
  } catch (err) {
      const {errorCode, traceId} =  appLogger.error('DATABASE_ERROR', {}, err as any);
    res.status(500).json({ message: "Database error", errorCode, traceId, status: 'error' });
  }
}

export async function getUserGroup(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await getUserGroupModel([id]);
    res.json({
      data: result.rows,
      message: 'User group retrieved successfully',
      status: 'success'
    });
  } catch (err) {
    const {errorCode, traceId} =  appLogger.error('DATABASE_ERROR', {}, err as any);
    res.status(500).json({ message: "Database error", errorCode, traceId, status: 'error' });
  }
}

export async function getAgents(req: Request, res: Response) {
  const { roles } = req.body;
  console.log("Roles received:", roles);
  try {
    const result = await getUserGroupModel(roles);
    res.json({
      data: result.rows,
      message: 'Users retrieved successfully',
      status: 'success'
    });
  } catch (err) {
    const {errorCode, traceId} =  appLogger.error('DATABASE_ERROR', { roles: req.body.roles }, err as any);
    res.status(500).json({ message: "Database error", errorCode, traceId, status: 'error' });
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
     const {errorCode, traceId} =  appLogger.error('DATABASE_ERROR', {}, err as any);
    res.status(500).json({ message: "Database error", errorCode, traceId, status: 'error' });
  }
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  // const { name, email, role, departmentId } = req.body;
  try {
    const result = await updateUserModel(req.params.id, {...req.body});
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    await pushUserListUpdateToAdminDashboard()
    res.status(200).json('ok');
  } catch (err) {
    const {errorCode, traceId} =  appLogger.error('DATABASE_ERROR', {payload: req.body}, err as any);
    res.status(500).json({ message: "Database error", errorCode, traceId, status: 'error' });
  }
}
