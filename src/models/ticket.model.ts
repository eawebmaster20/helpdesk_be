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
  createdAt: string;
  updatedAt: string;
}

export interface TicketApproval {
  step: "department_head" | "hr";
  status: "Pending" | "Approved" | "Rejected";
  decidedBy?: string; // userId
  decidedAt?: string;
  comment?: string;
}

import { db } from "../db";

export async function getTicketsModel() {
  return db.query("SELECT * FROM tickets ORDER BY created_at DESC");
}

export async function createTicketModel(
  title: string,
  description: string,
  departmentId: string,
  createdBy: string,
  priority: string
) {
  return db.query(
    `INSERT INTO tickets (title, description, department_id, created_by, status, priority) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [title, description, departmentId, createdBy, "New", priority]
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
