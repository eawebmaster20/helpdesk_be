import {
  updateTicketModel,
  addTicketCommentModel,
  addTicketAttachmentModel,
  assignTicketModel,
} from "../models/ticket.model";

export async function updateTicket(req: Request, res: Response) {
  const { id } = req.params;
  const { title, description, status, priority, assigneeId } = req.body;
  try {
    const result = await updateTicketModel(
      id,
      title,
      description,
      status,
      priority,
      assigneeId
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function addTicketComment(req: Request, res: Response) {
  const { id } = req.params;
  const { body, visibility, authorId } = req.body;
  if (!body || !authorId) {
    return res.status(400).json({ message: "body and authorId are required" });
  }
  try {
    const result = await addTicketCommentModel(
      id,
      body,
      visibility || "public",
      authorId
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function addTicketAttachment(req: Request, res: Response) {
  const { id } = req.params;
  const { filename, url, uploadedBy } = req.body;
  if (!filename || !url || !uploadedBy) {
    return res
      .status(400)
      .json({ message: "filename, url, and uploadedBy are required" });
  }
  try {
    const result = await addTicketAttachmentModel(
      id,
      filename,
      url,
      uploadedBy
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function assignTicket(req: Request, res: Response) {
  const { id } = req.params;
  const { assigneeId, auto } = req.body;
  if (auto) {
    return res.status(501).json({ message: "Auto-assign not implemented" });
  }
  if (!assigneeId) {
    return res
      .status(400)
      .json({ message: "assigneeId is required if auto is not set" });
  }
  try {
    const result = await assignTicketModel(id, assigneeId);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function transitionTicket(req: Request, res: Response) {
  const { id } = req.params;
  const { to, reason } = req.body;
  const allowedStatuses = [
    "New",
    "Pending Approval",
    "Dept Head Approved",
    "HR Approved",
    "Assigned",
    "In Progress",
    "Resolved",
    "Closed",
  ];
  if (!to || !allowedStatuses.includes(to)) {
    return res
      .status(400)
      .json({ message: "Invalid or missing status transition" });
  }
  try {
    const ticketResult = await db.query(
      "SELECT id FROM tickets WHERE id = $1",
      [id]
    );
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    await db.query(
      `UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2`,
      [to, id]
    );
    const transitionResult = await db.query(
      `INSERT INTO ticket_transitions (ticket_id, to_status, reason) VALUES ($1, $2, $3) RETURNING *`,
      [id, to, reason]
    );
    res.json({ message: "Transitioned", transition: transitionResult.rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function linkTicket(req: Request, res: Response) {
  const { id } = req.params;
  const { targetId, type } = req.body;
  if (!targetId || !type) {
    return res.status(400).json({ message: "targetId and type are required" });
  }
  try {
    const ticketResult = await db.query(
      "SELECT id FROM tickets WHERE id = $1",
      [id]
    );
    const targetResult = await db.query(
      "SELECT id FROM tickets WHERE id = $1",
      [targetId]
    );
    if (ticketResult.rows.length === 0 || targetResult.rows.length === 0) {
      return res.status(404).json({ message: "Ticket or target not found" });
    }
    const result = await db.query(
      `INSERT INTO ticket_links (ticket_id, target_id, type) VALUES ($1, $2, $3) RETURNING *`,
      [id, targetId, type]
    );
    res.status(201).json({ message: "Linked", link: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}
import { Request, Response } from "express";
import { db } from "../db";

export async function getTickets(req: Request, res: Response) {
  try {
    const result = await db.query(
      "SELECT * FROM tickets ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function createTicket(req: Request, res: Response) {
  const { title, description, departmentId, createdBy, priority } = req.body;
  if (!title || !description || !departmentId || !createdBy || !priority) {
    return res.status(400).json({
      message:
        "title, description, departmentId, createdBy, and priority are required",
    });
  }
  try {
    const result = await db.query(
      `INSERT INTO tickets (title, description, department_id, created_by, status, priority) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, departmentId, createdBy, "New", priority]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function getTicketById(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await db.query("SELECT * FROM tickets WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}
// ...add more ticket-related controller functions as needed...
