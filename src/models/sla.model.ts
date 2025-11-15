import { db } from "../db";

export async function createSLAModel(name: string, description: string, responseTimeHours: number, resolutionTimeHours: number) {
  const result = await db.query(
    `INSERT INTO sla_policies (name, description, response_time_hours, resolution_time_hours) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, description, responseTimeHours, resolutionTimeHours]
  );
  return result.rows[0];
}

export async function applySLAPolicyToTicket(ticketId: string, slaPolicyId: string): Promise<void> {
  await db.query(
    `UPDATE tickets SET sla_policy_id = $1 WHERE id = $2`,
    [slaPolicyId, ticketId]
  );
}

export async function updateSLAModel(slaPolicyId: string, name: string, description: string, responseTimeHours: number, resolutionTimeHours: number) {
  const result = await db.query(
    `UPDATE sla_policies SET name = $1, description = $2, response_time_hours = $3, resolution_time_hours = $4 WHERE id = $5 RETURNING *`,
    [name, description, responseTimeHours, resolutionTimeHours, slaPolicyId]
  );
  return result.rows[0];
}

export async function getAllSLAPoliciesModel() {
  const result = await db.query(
    `SELECT * FROM sla_policies`
  );
  return result.rows;
}

export async function getSLAPolicyByIdModel(slaPolicyId: string) {
  const result = await db.query(
    `SELECT * FROM sla_policies WHERE id = $1`,
    [slaPolicyId]
  );
  return result.rows[0];
}

export async function deleteSLAPolicyByIdModel(slaPolicyId: string): Promise<void> {
  await db.query(
    `DELETE FROM sla_policies WHERE id = $1`,
    [slaPolicyId]
  );
}

export async function createSLAWithMinutes(
  name: string, 
  description: string, 
  responseTimeMinutes: number, 
  resolutionTimeMinutes: number
) {
  const responseTimeHours = responseTimeMinutes / 60;
  const resolutionTimeHours = resolutionTimeMinutes / 60;
  
  const result = await db.query(
    `INSERT INTO sla_policies (name, description, response_time_hours, resolution_time_hours) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, description, responseTimeHours, resolutionTimeHours]
  );
  return result.rows[0];
}

export async function getTicketSLABreachTimes(ticketId: string) {
  const result = await db.query(`
    SELECT 
      t.created_at,
      t.status,
      sp.response_time_hours,
      sp.resolution_time_hours,
      sp.name as sla_policy_name
    FROM tickets t
    LEFT JOIN sla_policies sp ON t.sla_policy_id = sp.id
    WHERE t.id = $1
  `, [ticketId]);
  
  return result.rows[0];
}