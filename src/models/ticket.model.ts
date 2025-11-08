import { db } from "../db";


export interface Department {
  id: string;
  name: string;
  headId: string; // userId of department head
}

export interface User {
  id: string;
  name: string;
  email: string;
  role:
    | "super_admin"
    | "department_head"
    | "hr"
    | "it_head"
    | "it_personnel"
    | "employee";
  departmentId?: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  departmentId: string;
  createdBy: string; // userId
  status:
    | "New"
    | "Pending Approval"
    | "Dept Head Approved"
    | "HR Approved"
    | "Assigned"
    | "In Progress"
    | "Resolved"
    | "Closed";
  priority: "Low" | "Medium" | "High" | "Critical";
  assigneeId?: string;
  approvals: TicketApproval[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketApproval {
  step: "department_head" | "hr";
  status: "Pending" | "Approved" | "Rejected";
  decidedBy?: string; // userId
  decidedAt?: string;
  comment?: string;
}

export interface FormattedTicket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  attachments: string[];
  created_at: string;
  updated_at: string;
  department: {
    id: string;
    name: string;
  } | null;
  category: {
    id: string;
    name: string;
    description: string;
  } | null;
  created_by: {
    id: string;
    name: string;
    email: string;
  } | null;
  created_for: {
    id: string;
    name: string;
    email: string;
  } | null;
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export async function getTicketsModel() {
  return db.query("SELECT * FROM tickets ORDER BY created_at DESC");
}

export async function getFormatedTicketsModel(userId?: string) {
  let result;
  if (userId) {
    result = await db.query(`
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
      WHERE t.created_by = $1 or t.created_for = $1
      ORDER BY t.created_at DESC
    `, [userId]);
  } else {
    result = await db.query(`
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
  }

  const formatedResults = result.rows.map((row) => ({
    id: row.id,
    ticket_number: row.ticket_number,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    attachments: row.attachments,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
    department: row.department_id ? {
      id: row.department_id,
      name: row.department_name
    } : null,
    category: row.category_id ? {
      id: row.category_id,
      name: row.category_name,
      description: row.category_description
    } : null,
    created_by: row.created_by ? {
      id: row.created_by,
      name: row.created_by_name,
      email: row.created_by_email
    } : null,
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

  return formatedResults;
}

export async function getFormatedTicketsIdModel(id: string) {
  const result = await db.query(`
      SELECT
        t.*,
        d.name as department_name,
        d.id as department_id,
        c.name as category_name,
        c.description as category_description,
        c.id as category_id,
        u_creator.id as created_for_id,
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
      ORDER BY t.created_at DESC
    `, [id]);


    const formatedResults = result.rows.map((row) => ({
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
    created_by: row.created_by ? {
      id: row.created_by,
      name: row.created_by_name,
      email: row.created_by_email
    } : null,
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
    return formatedResults[0];
}

export async function getFormatedL2TicketsModel(assigneeId: string) {
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
      WHERE t.assignee_id = $1
      ORDER BY t.created_at DESC
    `, [assigneeId]);


    const formatedResults = result.rows.map((row) => ({
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
    created_by: row.created_by ? {
      id: row.created_by,
      name: row.created_by_name,
      email: row.created_by_email
    } : null,
    assignee: row.assignee_id ? {
      id: row.assignee_id,
      name: row.assignee_name,
      email: row.assignee_email
    } : null
  }));
    return formatedResults;
}

export async function createTicketModel(
  ticketNumber: string,
  title: string,
  description: string,
  departmentId: string,
  createdBy: string,
  createdFor: string,
  priority: string,
  categoryId?: string,
  attachments?: string[]
) {
  return db.query(
    `INSERT INTO tickets (ticket_number, title, description, department_id, created_by, created_for, status, priority, category_id, attachments) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [ticketNumber, title, description, departmentId, createdBy, createdFor, "New", priority, categoryId, attachments || []]
  );
}

export async function getTicketByIdModel(id: string) {
  return db.query("SELECT * FROM tickets WHERE id = $1", [id]);
}

export async function updateTicketModel(
  id: string,
  title?: string,
  description?: string,
  status?: string,
  priority?: string,
  assigneeId?: string
) {
  return db.query(
    `UPDATE tickets SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      status = COALESCE($3, status),
      priority = COALESCE($4, priority),
      assignee_id = COALESCE($5, assignee_id),
      updated_at = NOW()
    WHERE id = $6 RETURNING *`,
    [title, description, status, priority, assigneeId, id]
  );
}

export async function addTicketCommentModel(
  ticketId: string,
  body: string,
  visibility: string,
  authorId: string
) {
  return db.query(
    `INSERT INTO ticket_comments (ticket_id, body, visibility, author_id) VALUES ($1, $2, $3, $4) RETURNING *`,
    [ticketId, body, visibility, authorId]
  );
}

export async function addTicketAttachmentModel(
  ticketId: string,
  filename: string,
  url: string,
  uploadedBy: string
) {
  return db.query(
    `INSERT INTO ticket_attachments (ticket_id, filename, url, uploaded_by) VALUES ($1, $2, $3, $4) RETURNING *`,
    [ticketId, filename, url, uploadedBy]
  );
}

export async function assignTicketModel(id: string, assigneeId: string) {
  return db.query(
    `UPDATE tickets SET assignee_id = $1, status = 'Assigned', updated_at = NOW() WHERE id = $2 RETURNING *`,
    [assigneeId, id]
  );
}

export async function transitionTicketModel(id: string, to: string) {
  return db.query(
    `UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2`,
    [to, id]
  );
}

export async function insertTicketTransitionModel(
  ticketId: string,
  to: string,
  reason?: string
) {
  return db.query(
    `INSERT INTO ticket_transitions (ticket_id, to_status, reason) VALUES ($1, $2, $3) RETURNING *`,
    [ticketId, to, reason]
  );
}

export async function linkTicketModel(
  id: string,
  targetId: string,
  type: string
) {
  return db.query(
    `INSERT INTO ticket_links (ticket_id, target_id, type) VALUES ($1, $2, $3) RETURNING *`,
    [id, targetId, type]
  );
}

// Ticket Activity tracking functions
export async function addTicketActivityModel(
  ticketId: string,
  type: 'status' | 'comment' | 'assignment' | 'attachment',
  userId: string,
  action: string,
  comment?: string
) {
  return db.query(
    `INSERT INTO ticket_activities (ticket_id, type, user_id, action, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [ticketId, type, userId, action, comment]
  );
}

export async function getTicketActivitiesModel(ticketId:any) {
  const result = await db.query(`
    SELECT 
      ta.*,
      u.name as user_name,
      u.email as user_email
    FROM ticket_activities ta
    LEFT JOIN users u ON ta.user_id = u.id
    WHERE ta.ticket_id = $1
    ORDER BY ta.created_at DESC
  `, [ticketId]);

  return result.rows.map(row => ({
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
}
