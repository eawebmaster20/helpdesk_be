import { db } from "../db";

export async function getAllStatusesModel(){
  const statuses = await db.query(`
    SELECT *
    FROM ticket_statuses
    ORDER BY created_at DESC
  `);
  return statuses.rows;
}

export async function createStatusModel(name: string, enabled?: boolean) {
  return db.query(
    `INSERT INTO ticket_statuses (name, enabled) VALUES ($1, $2) RETURNING *`,
    [name, enabled]
  );
}

export async function updateStatusModel(
  id: string,
  name?: string,
  enabled?: boolean
) {
  return db.query(
    `UPDATE ticket_statuses SET name = COALESCE($1, name), enabled = COALESCE($2, enabled), updated_at = NOW() WHERE id = $3 RETURNING *`,
    [name, enabled, id]
  );
}
