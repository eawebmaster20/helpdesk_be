import { db } from "../db";
import { Request, Response } from "express";

// Ticket Priorities
export async function createTicketPriority(req: Request, res: Response) {
  const { name, enabled, slaPolicyId } = req.body;
  if (!name) {
    return res.status(400).json({ message: "name is required" });
  }
  try {
    const result = await db.query(
      `INSERT INTO ticket_priorities (name, enabled, sla_policy_id) VALUES ($1, $2, $3) RETURNING *`,
      [name, enabled, slaPolicyId]
    );
    res.status(201).json({
      data: result.rows[0],
      message: 'Priority created successfully',
      status: 'success'
    });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function createBulkTicketPriorities(req: Request, res: Response) {
  const { priorities } = req.body;
  if (!Array.isArray(priorities) || priorities.length === 0) {
    return res.status(400).json({ message: "priorities array is required" });
  }
  
  try {
    await db.query("BEGIN");
    
    // console.log("Creating ticket priority:", priorities);
    const createdPriorities = [];
    for (const priority of priorities) {
      const { name, enabled, slaPolicyId } = priority;
      if (!name) {
        await db.query("ROLLBACK");
        return res.status(400).json({ message: "name is required for all priorities" });
      }
      
      const result = await db.query(
        `INSERT INTO ticket_priorities (name, enabled, sla_policy_id) VALUES ($1, $2, $3) RETURNING *`,
        [name, enabled, slaPolicyId]
      );
      createdPriorities.push(result.rows[0]);
    }
    
    await db.query("COMMIT");
    res.status(201).json({
      data: createdPriorities,
      message: `${createdPriorities.length} priorities created successfully`,
      status: 'success'
    });
  } catch (err) {
    await db.query("ROLLBACK");
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function getTicketPriorities(req: Request, res: Response) {
  try {
    const result = await db.query("SELECT * FROM ticket_priorities");
    res.json({
        data: result.rows,
        message: 'Priorities retrieved successfully',
        status: 'success'
    });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function updateTicketPriority(req: Request, res: Response) {
  const { id } = req.params;
  const { name, enabled, slaPolicyId } = req.body;
    if (!name) {
    return res.status(400).json({ message: "name is required" });
  }
  try {
    const result = await db.query(
      `UPDATE ticket_priorities SET name = $1, enabled = $2, sla_policy_id = $3 WHERE id = $4 RETURNING *`,
      [name, enabled, slaPolicyId, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Priority not found" });
    }
    res.json({
      data: result.rows[0],
      message: 'Priority updated successfully',
      status: 'success'
    });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
};

export async function deleteTicketPriority(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await db.query(
      `DELETE FROM ticket_priorities WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Priority not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
};