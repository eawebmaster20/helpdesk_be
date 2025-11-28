import { db } from "../db";
import { Request, Response } from "express";

// Ticket Statuses
export async function createTicketStatus(req: Request, res: Response) {
  const { name, enabled } = req.body;
  if (!name) {
    return res.status(400).json({ message: "name is required" });
  }
  try {
    const result = await db.query(
      `INSERT INTO ticket_statuses (name, enabled) VALUES ($1, $2) RETURNING *`,
      [name, enabled]
    );
    res.status(201).json({
      data: result.rows[0],
      message: 'Status created successfully',
      status: 'success'
    });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function createBulkTicketStatuses(req: Request, res: Response) {
  const { statuses } = req.body;
  if (!Array.isArray(statuses) || statuses.length === 0) {
    return res.status(400).json({ message: "statuses array is required" });
  }
  
  try {
    await db.query("BEGIN");
    // console.log("Creating ticket status:", statuses);
    const createdStatuses = [];
    for (const status of statuses) {
      const { cssClass, name, enabled } = status;
      if (!name || !cssClass) {
        await db.query("ROLLBACK");
        return res.status(400).json({ message: "name and cssClass are required for all statuses" });
      }
      
      const result = await db.query(
        `INSERT INTO ticket_statuses (name, enabled, css_class) VALUES ($1, $2, $3) RETURNING *`,
        [name, enabled, cssClass]
      );
      createdStatuses.push(result.rows[0]);
    }
    
    await db.query("COMMIT");
    res.status(201).json({
      data: createdStatuses,
      message: `${createdStatuses.length} statuses created successfully`,
      status: 'success'
    });
  } catch (err) {
    await db.query("ROLLBACK");
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function getTicketStatuses(req: Request, res: Response) {
  try {
    const result = await db.query("SELECT * FROM ticket_statuses");
    res.json({
        data: result.rows,
        message: 'Statuses retrieved successfully',
        status: 'success'
    });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function updateTicketStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { name, enabled } = req.body;
    if (!name) {
    return res.status(400).json({ message: "name is required" });
  }
  try {
    const result = await db.query(
      `UPDATE ticket_statuses SET name = $1, enabled = $2 WHERE id = $3 RETURNING *`,
      [name, enabled, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Status not found" });
    }
    res.json({
      data: result.rows[0],
      message: 'Status updated successfully',
      status: 'success'
    });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
};

export async function deleteTicketStatus(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await db.query(
      `DELETE FROM ticket_statuses WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Status not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
};