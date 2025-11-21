import {
  updateTicketModel,
  addTicketCommentModel,
  addTicketAttachmentModel,
  assignTicketModel,
  addTicketActivityModel,
  getTicketActivitiesModel,
  getFormatedTicketsIdModel,
  closeTicketModel,
} from "../models/ticket.model";
import { Request, Response } from "express";
import { db } from "../db";
import { io } from "../index";
import { emitTicketActivityUpdate, emitTicketCreatedEvent, emitTicketUpdate, emitUserTicketAssign } from "../websockets/ticket.socket";
import { sendEmail } from "../utils/bull-email";
import { applySLAPolicyToTicket } from "./sla.controller";
import { addSLACompliance } from "../models/sla.model";

export async function updateTicket(req: Request, res: Response) {
  const { id } = req.params;
  const { title, userId, description, status, priority, priorityName, assigneeId } = req.body;
  try {
    const unUpdatedTicket = await getFormatedTicketsIdModel(id);
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
    
    const updatedTicket = await getFormatedTicketsIdModel(id);
    let action = ""
    // Determine what was updated for activity tracking
    if (title && title !== updatedTicket.title) {
      action += `changed title from "${title}" to "${updatedTicket.title}". `;
    }
    if (description && description !== updatedTicket.description) {
      action += `changed description from "${description}" to "${updatedTicket.description}". `;
    }
    if (status && status !== updatedTicket.status) {
      action += `changed status from "${unUpdatedTicket.status}" to "${updatedTicket.status}". `;
    }
    if (priority && priority !== updatedTicket.priority) {
      action += `changed priority from "${unUpdatedTicket.priority?.name}" to "${updatedTicket.priority?.name}". `;
    }
    // if (assigneeId !== ticketResult.assignee?.id) {
    //   action += `Reassigned assignee from "${ticketResult.assignee?.name}" to "${assigneeId}". `;
    // }
    await addTicketActivityModel(id, 'status', userId, action);
    const usersToNotify = new Set<string>();
    usersToNotify.add(`${updatedTicket.created_by?.id}:ticket:update`);
    usersToNotify.add(`${updatedTicket.assignee?.id}:ticket:update`);
    usersToNotify.add(`tickets:update`);
    if (updatedTicket.created_for?.id) {
      usersToNotify.add(`${updatedTicket.created_for.id}:ticket:update`);
    }
    const usersToEmail = [
      updatedTicket.created_by?.email,
      // updatedTicket.assignee?.email,
      updatedTicket.created_for?.email
    ].filter(Boolean) as string[];

    res.status(200).json();

    emitTicketUpdate(io, assigneeId, [...usersToNotify], {
      data: updatedTicket,
      message: "A ticket has been updated",
      success: true
    });
    if (updatedTicket.status === 'Resolved') {
      sendEmail('status_update', usersToEmail, `There is an update on your ticket ${updatedTicket.ticket_number}`, updatedTicket);
    }
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function editTicket(req: Request, res: Response) {
  const { id } = req.params;
  const { title, description, status, priority, assigneeId, userId } = req.body;
}

export async function addTicketComment(req: Request, res: Response) {
  const { id } = req.params;
  const { comment, type, userId } = req.body;
  const user = await db.query("SELECT id, name, email FROM users WHERE id = $1", [userId]);
  if (user.rowCount === 0) {
    res.status(400).json({ message: "Invalid user" });
    return;
  }
  const ticket = await getFormatedTicketsIdModel(id);
  if (!ticket) {
    res.status(404).json({ message: "Ticket not found" });
    return;
  }
  const action = "added a comment";
 try {
   await addTicketActivityModel(id, type, userId, action, comment);
    const updatedActivities = await getTicketActivitiesModel(id);
    const usersToNotify = new Set<string>();
    usersToNotify.add(`ticket:activity:update`);
    // usersToNotify.add(`tickets:update`);
    // if (ticket.assignee?.id) {
    //   usersToNotify.add(`${ticket.assignee.id}:ticket:update`);
    // }
    // if (ticket.created_for?.id) {
    //   usersToNotify.add(`${ticket.created_for.id}:ticket:update`);
    // }
    emitTicketActivityUpdate(io, Array.from(usersToNotify), {
      data: updatedActivities,
      message: "A new comment has been added",
      success: true,
    });
    res.status(201).json();
 } catch (error) {
    res.status(500).json({ message: "Database error", error: error });
 }
}

export async function addTicketAttachment(req: Request, res: Response) {
  const { id } = req.params;
  const { urls, uploadedBy } = req.body;
  if (!urls || !uploadedBy) {
    return res
      .status(400)
      .json({ message: "urls and uploadedBy are required" });
  }
  try {
    console.log('activity added')
    const result = await addTicketAttachmentModel(
      id,
      urls,
      uploadedBy
    );
    
    // Add activity tracking
    const action = "added an attachment";
    await addTicketActivityModel(id, 'attachment', uploadedBy, action, `Added ${urls.length} attachment(s)`);
    const ticket = await getFormatedTicketsIdModel(id);
    const ticketActivities = await getTicketActivitiesModel(id);
    const usersToNotifyOnActivity = new Set<string>();
    // usersToNotifyOnActivity.add(`ticket:activities`);
    usersToNotifyOnActivity.add(`ticket:activity:update`);
    if (ticket.created_for && uploadedBy !== ticket.created_for.id) {
      usersToNotifyOnActivity.add(`${ticket.created_for.id}:ticket:activities`);
    }
    emitTicketActivityUpdate(io, Array.from(usersToNotifyOnActivity), {
      data: ticketActivities,
      message: "A ticket has been updated",
      success: true
    });
    const usersToNotify = new Set<string>();
    usersToNotify.add(`tickets:update`);
    usersToNotify.add(`${ticket.created_by?.id}:ticket:update`);
    emitTicketActivityUpdate(io, Array.from(usersToNotify), {
      data: ticket,
      message: "A ticket has been updated",
      success: true
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function assignTicket(req: Request, res: Response) {
  const { id } = req.params;
  const auto = process.env.AUTO_ASSIGN_TICKETS;
  const { assigneeId, userId } = req.body;
  if (auto === 'true') {
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
    const createdByResult = await db.query(
      "SELECT created_by FROM tickets WHERE id = $1",
      [id]
    );
    const createdBy = createdByResult.rows[0]?.created_by;
    
    const result = await assignTicketModel(id, assigneeId);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    
    
    // Add activity tracking
    const assignee = assigneeResult.rows[0] || 'Unknown User';
    const action = `assigned the ticket to ${assignee.name}`;
    await addTicketActivityModel(id, 'assignment', userId, action);
    
    const ticket = await getFormatedTicketsIdModel(id);
    const usersInvolved = [
      `${assigneeId}:ticket:assign`, 
      `${createdBy}:ticket:update`,
      `tickets:update`
    ];

    emitUserTicketAssign(io, assigneeId, usersInvolved, {
      data: ticket,
      message: "A ticket has been assigned",
      success: true,
      timestamp: new Date().toISOString()
    });
    
    const usersToEmail = [
      ticket.assignee?.id,
      // ticket.created_by?.id
    ].filter(Boolean) as string[];
    sendEmail('ticket_assigned', usersToEmail, `Ticket ${ticket.ticket_number} has been assigned`, ticket);
    res.json({ message: "Assigned", data:[] });
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
    emitTicketUpdate(io, userId, ["ticket:statusChanged"], {
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

export async function closeTicket(req: Request, res: Response) {
  const { id } = req.params;
  const { userId, reason } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "userId is required for activity tracking" });
  }
  try {
    const ticketResult = await getFormatedTicketsIdModel(id);
    if (!ticketResult) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    await closeTicketModel(id);
    // Add activity tracking
    const action = reason? `closed the ticket with a Reason` : 'closed the ticket';
    await addTicketActivityModel(id, 'status', userId, action, reason);
    const updatedTicket = await getFormatedTicketsIdModel(id);

    // Emit real-time event for ticket status change
    // emitTicketUpdate(io, userId, ["ticket:statusChanged"], {
    //   data: updatedTicket,
    //   message: `Ticket status changed to Closed`,
    //   timestamp: new Date().toISOString()
    // });

    res.json({ 
      message: "Ticket closed successfully",
      data: updatedTicket,
      success: true
     });
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
        u_owner.name as owned_by_name,
        u_owner.email as owned_by_email,
        u_owner.id as owned_by_id,
        u_assignee.name as assignee_name,
        u_assignee.email as assignee_email,
        u_assignee.id as assignee_id
      FROM tickets t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u_creator ON t.created_by = u_creator.id
      LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
      LEFT JOIN users u_owner ON t.created_for = u_owner.id
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
      created_for: row.owned_by_id ? {
        id: row.owned_by_id,
        name: row.owned_by_name,
        email: row.owned_by_email
      } : null,
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
        u_owner.name as owned_by_name,
        u_owner.email as owned_by_email,
        u_owner.id as owned_by_id,
        u_assignee.name as assignee_name,
        u_assignee.email as assignee_email,
        u_assignee.id as assignee_id
      FROM tickets t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u_creator ON t.created_by = u_creator.id
      LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
      LEFT JOIN users u_owner ON t.created_for = u_owner.id
      WHERE t.created_by = $1 OR t.created_for = $1
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
      created_for: row.owned_by_id ? {
        id: row.owned_by_id,
        name: row.owned_by_name,
        email: row.owned_by_email
      } : null,
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
  const { title, description, departmentId, branchId, createdBy, createdFor, priority, categoryId } = req.body;
  if (!title || !title.trim() || !createdBy || !createdBy.trim() || !priority || !priority.trim() || !categoryId || !categoryId.trim()) {
    return res.status(400).json({
      message:
        "title, departmentId, createdBy, priority, category are required and cannot be empty",
        value:req.body
    });
  }
  
  try {
    
    // Generate next ticket number
    const counterResult = await db.query(
      `UPDATE ticket_counter SET current_number = current_number + 1, updated_at = NOW() 
       WHERE id = 1 RETURNING current_number`
    );

    
    const ticketNumber = `TKT-${counterResult.rows[0].current_number}`;
    
    // Create the ticket with the generated ticket number
    console.log('creating ticket with number:', ticketNumber);
    const result = await db.query(
      `INSERT INTO tickets (ticket_number, title, description, department_id, branch_id, created_by, created_for, status, priority_id, category_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        ticketNumber, 
        title, 
        description, 
        departmentId && departmentId.trim() !== '' ? departmentId : null, 
        branchId && branchId.trim() !== '' ? branchId : null,
        createdBy, 
        createdFor && createdFor.trim() !== '' ? createdFor : null,
        "New", 
        priority, 
        categoryId && categoryId.trim() !== '' ? categoryId : null
      ]
    );
    
    const ticketId = result.rows[0].id;
    console.log('ticket created with id:', ticketId); 
    
    // Add initial activity tracking for ticket creation
    const action = "created the ticket";
    if (createdBy && createdFor) {
      const createdUser = await db.query("SELECT id FROM users WHERE id = $1", [createdBy]);
      await addTicketActivityModel(ticketId, 'status', createdFor, `ticket a created for ${createdUser.rows[0].name}`);
    }else {
      await addTicketActivityModel(ticketId, 'status', createdBy, action);
    }
    const newTicket = await getFormatedTicketsIdModel(ticketId); 
    // Emit real-time event for new ticket creation
    const usersToNotify = new Set<string>();
    const usersToEmail:string[] = []
    usersToNotify.add(`${createdBy}:new`);
    usersToEmail.push((newTicket.created_by && newTicket.created_by.email) ? newTicket.created_by.email : '');
    if (createdFor) {
      usersToNotify.add(`${createdFor}:new`);
      if (newTicket.created_for && newTicket.created_for.email) {
        usersToEmail.push(newTicket.created_for.email);
      }
    }
    usersToNotify.add(`tickets:new`);
    emitTicketCreatedEvent(io, createdBy, Array.from(usersToNotify), {
      data: newTicket,
      message: "New ticket created",
      success: true,
      timestamp: new Date().toISOString()
    });
    res.status(201).json({
      message: "Ticket created successfully",
      data: newTicket,
      status: "success",
    });
    await addSLACompliance(newTicket);
    // const formatedTicket = await getFormatedTicketsIdModel(newTicket.id);
    sendEmail('ticket_created', usersToEmail, `Ticket ${ticketNumber} Created`, newTicket);


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
        u_owner.name as owned_by_name,
        u_owner.email as owned_by_email,
        u_owner.id as owned_by_id,
        u_assignee.name as assignee_name,
        u_assignee.email as assignee_email,
        u_assignee.id as assignee_id
      FROM tickets t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u_creator ON t.created_by = u_creator.id
      LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
      LEFT JOIN users u_owner ON t.created_for = u_owner.id
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
      created_for: row.owned_by_id ? {
        id: row.owned_by_id,
        name: row.owned_by_name,
        email: row.owned_by_email
      } : null,
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
    
    res.json({
      message: '',
      data: result,
      status: 'success'
    });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}
