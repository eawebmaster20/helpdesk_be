import { db } from "../db";

export async function createApprovalsModel(ticketId: string, steps: string[]) {
  const insertedApprovals = [];
  for (const step of steps) {
    const result = await db.query(
      `INSERT INTO ticket_approvals (ticket_id, step, status) VALUES ($1, $2, 'Pending') RETURNING *`,
      [ticketId, step]
    );
    insertedApprovals.push(result.rows[0]);
  }
  await db.query(
    `UPDATE tickets SET status = 'Pending Approval', updated_at = NOW() WHERE id = $1`,
    [ticketId]
  );
  return insertedApprovals;
}

export async function decideApprovalModel(
  id: string,
  status: string,
  comment: string,
  decidedBy: string
) {
  const result = await db.query(
    `UPDATE ticket_approvals SET status = $1, comment = $2, decided_by = $3, decided_at = NOW(), updated_at = NOW() WHERE id = $4 RETURNING *`,
    [status, comment, decidedBy, id]
  );
  return result;
}

export async function getTicketApprovalsStatus(ticketId: string) {
  return db.query(`SELECT status FROM ticket_approvals WHERE ticket_id = $1`, [
    ticketId,
  ]);
}

export async function updateTicketStatus(ticketId: string, newStatus: string) {
  return db.query(
    `UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2`,
    [newStatus, ticketId]
  );
}
