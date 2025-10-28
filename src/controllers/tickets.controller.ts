import {
  updateTicketModel,
  addTicketCommentModel,
  addTicketAttachmentModel,
  assignTicketModel,
  addTicketActivityModel,
  getTicketActivitiesModel,
} from "../models/ticket.model";
import { Request, Response } from "express";
import { db } from "../db";
import { io } from "../index";
import { emitTicketUpdate, emitUserTicketUpdate } from "../websockets/ticket.socket";

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
    
    // Add activity tracking
    const action = "commented on the ticket";
    await addTicketActivityModel(id, 'comment', authorId, action, body);
    
    const newComment = result.rows[0];
    
    // Emit real-time event for new comment
    emitTicketUpdate(io, "ticket:commentAdded", {
      ticketId: id,
      comment: newComment,
      message: "New comment added to ticket",
      timestamp: new Date().toISOString()
    });
    
    res.status(201).json(newComment);
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
    
    // Add activity tracking
    const action = "added an attachment";
    await addTicketActivityModel(id, 'attachment', uploadedBy, action, filename);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function assignTicket(req: Request, res: Response) {
  const { id } = req.params;
  const auto = process.env.AUTO_ASSIGN_TICKETS;
  const { assigneeId, userId } = req.body;
  if (auto) {
    return res.status(501).json({ message: "Auto-assign not implemented" });
  }
  if (!assigneeId) {
    return res
      .status(400)
      .json({ message: "assigneeId is required if auto is not set" });
  }
  if (!userId) {
    return res.status(400).json({ message: "userId is required for activity tracking" });
  }
  try {
    // Get assignee name for activity description
    const assigneeResult = await db.query(
      "SELECT name FROM users WHERE id = $1",
      [assigneeId]
    );
    
    const result = await assignTicketModel(id, assigneeId);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    
    // Add activity tracking
    const assigneeName = assigneeResult.rows[0]?.name || 'Unknown User';
    const action = `assigned the ticket to ${assigneeName}`;
    await addTicketActivityModel(id, 'assignment', userId, action);
    
    // Emit real-time event for ticket assignment
    emitTicketUpdate(io, "ticket:assigned", {
      ticketId: id,
      assigneeId: assigneeId,
      assigneeName: assigneeName,
      assignedBy: userId,
      message: `Ticket assigned to ${assigneeName}`,
      timestamp: new Date().toISOString()
    });
    
    // Notify the assignee specifically
    emitUserTicketUpdate(io, assigneeId, "ticket:assignedToYou", {
      ticketId: id,
      message: "A ticket has been assigned to you",
      timestamp: new Date().toISOString()
    });
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function transitionTicket(req: Request, res: Response) {
  const { id } = req.params;
  const { to, reason, userId } = req.body;
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
  if (!userId) {
    return res.status(400).json({ message: "userId is required for activity tracking" });
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
    
    // Add activity tracking
    const action = `changed status to ${to}`;
    await addTicketActivityModel(id, 'status', userId, action, reason);
    
    // Emit real-time event for ticket status change
    emitTicketUpdate(io, "ticket:statusChanged", {
      ticketId: id,
      newStatus: to,
      reason: reason,
      changedBy: userId,
      message: `Ticket status changed to ${to}`,
      timestamp: new Date().toISOString()
    });
    
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

export async function getTickets(req: Request, res: Response) {
  try {
    const result = await db.query(`
      SELECT 
        t.*,
        d.name as department_name,
        d.id as department_id,
        c.name as category_name,
        c.description as category_description,
        c.id as category_id,
        u_creator.name as created_by_name,
        u_creator.email as created_by_email,
        u_assignee.name as assignee_name,
        u_assignee.email as assignee_email,
        u_assignee.id as assignee_id
      FROM tickets t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u_creator ON t.created_by = u_creator.id
      LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
      ORDER BY t.created_at DESC
    `);
    
    // Transform the data to include nested objects
    const transformedData = result.rows.map(row => ({
      id: row.id,
      ticket_number: row.ticket_number,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      attachments: row.attachments,
      created_at: row.created_at,
      updated_at: row.updated_at,
      department: row.department_id ? {
        id: row.department_id,
        name: row.department_name
      } : null,
      category: row.category_id ? {
        id: row.category_id,
        name: row.category_name,
        description: row.category_description
      } : null,
      created_by: {
        id: row.created_by,
        name: row.created_by_name,
        email: row.created_by_email
      },
      assignee: row.assignee_id ? {
        id: row.assignee_id,
        name: row.assignee_name,
        email: row.assignee_email
      } : null
    }));
    
    res.json({
      message: '',
      data: transformedData,
      status: 'success'
    });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function getTicketsByUser(req: Request, res: Response) {
  const { userId } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        t.*,
        d.name as department_name,
        d.id as department_id,
        c.name as category_name,
        c.description as category_description,
        c.id as category_id,
        u_creator.name as created_by_name,
        u_creator.email as created_by_email,
        u_assignee.name as assignee_name,
        u_assignee.email as assignee_email,
        u_assignee.id as assignee_id
      FROM tickets t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u_creator ON t.created_by = u_creator.id
      LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
      WHERE t.created_by = $1
      ORDER BY t.created_at DESC
    `, [userId]);
    
    // Transform the data to include nested objects
    const transformedData = result.rows.map(row => ({
      id: row.id,
      ticket_number: row.ticket_number,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      attachments: row.attachments,
      created_at: row.created_at,
      updated_at: row.updated_at,
      department: row.department_id ? {
        id: row.department_id,
        name: row.department_name
      } : null,
      category: row.category_id ? {
        id: row.category_id,
        name: row.category_name,
        description: row.category_description
      } : null,
      created_by: {
        id: row.created_by,
        name: row.created_by_name,
        email: row.created_by_email
      },
      assignee: row.assignee_id ? {
        id: row.assignee_id,
        name: row.assignee_name,
        email: row.assignee_email
      } : null
    }));
    
    res.json({
      message: '',
      data: transformedData,
      status: 'success'
    });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}


export async function createTicket(req: Request, res: Response) {
  const { title, description, departmentId, createdBy, priority, categoryId, attachments } = req.body;
  if (!title || !title.trim() || !createdBy || !createdBy.trim() || !priority || !priority.trim() || !categoryId || !categoryId.trim()) {
    return res.status(400).json({
      message:
        "title, departmentId, createdBy, priority, category are required and cannot be empty",
        value:req.body
    });
  }
  
  try {
    // Validate that the user exists
    const userCheck = await db.query("SELECT id FROM users WHERE id = $1", [createdBy]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid createdBy: User does not exist",
        value: { createdBy }
      });
    }
    
    // Generate next ticket number
    const counterResult = await db.query(
      `UPDATE ticket_counter SET current_number = current_number + 1, updated_at = NOW() 
       WHERE id = 1 RETURNING current_number`
    );

    
    const ticketNumber = `TKT-${counterResult.rows[0].current_number}`;
    
    // Create the ticket with the generated ticket number
    const result = await db.query(
      `INSERT INTO tickets (ticket_number, title, description, department_id, created_by, status, priority, category_id, attachments) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        ticketNumber, 
        title, 
        description, 
        departmentId && departmentId.trim() !== '' ? departmentId : null, 
        createdBy, 
        "New", 
        priority, 
        categoryId && categoryId.trim() !== '' ? categoryId : null, 
        attachments || []
      ]
    );

    
    const ticketId = result.rows[0].id;
    
    // Add initial activity tracking for ticket creation
    const action = "created the ticket";
    await addTicketActivityModel(ticketId, 'status', createdBy, action);
    const newTicket = result.rows[0];
    
    // Emit real-time event for new ticket creation
    emitTicketUpdate(io, "ticket:created", {
      ticket: newTicket,
      message: "New ticket created",
      timestamp: new Date().toISOString()
    });


    // Emit to the ticket creator specifically
    emitUserTicketUpdate(io, createdBy, "ticket:created", {
      ticket: newTicket,
      message: "Your ticket has been created successfully",
      timestamp: new Date().toISOString()
    });
    
    res.status(201).json(newTicket);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function getTicketById(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        t.*,
        d.name as department_name,
        d.id as department_id,
        c.name as category_name,
        c.description as category_description,
        c.id as category_id,
        u_creator.name as created_by_name,
        u_creator.email as created_by_email,
        u_assignee.name as assignee_name,
        u_assignee.email as assignee_email,
        u_assignee.id as assignee_id
      FROM tickets t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u_creator ON t.created_by = u_creator.id
      LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
      WHERE t.id = $1
    `, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    
    const row = result.rows[0];
    
    // Transform the data to include nested objects
    const transformedData = {
      id: row.id,
      ticket_number: row.ticket_number,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      attachments: row.attachments,
      created_at: row.created_at,
      updated_at: row.updated_at,
      department: row.department_id ? {
        id: row.department_id,
        name: row.department_name
      } : null,
      category: row.category_id ? {
        id: row.category_id,
        name: row.category_name,
        description: row.category_description
      } : null,
      created_by: {
        id: row.created_by,
        name: row.created_by_name,
        email: row.created_by_email
      },
      assignee: row.assignee_id ? {
        id: row.assignee_id,
        name: row.assignee_name,
        email: row.assignee_email
      } : null
    };
    
    res.json({
      message: '',
      data: transformedData,
      status: 'success'
    });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

// Get ticket activities
export async function getTicketActivities(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await getTicketActivitiesModel(id);
    
    // Transform the data to include nested user objects
    const transformedData = result.rows.map(row => ({
      id: row.id,
      ticket_id: row.ticket_id,
      type: row.type,
      action: row.action,
      comment: row.comment,
      created_at: row.created_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email
      }
    }));
    
    res.json({
      message: '',
      data: transformedData,
      status: 'success'
    });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}
