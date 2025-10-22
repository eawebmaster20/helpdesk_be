import { db } from "../db";

export async function getBranchesModel() {
  return db.query("SELECT * FROM branches ORDER BY created_at DESC");
}

export async function insertBranchModel(name: string, headId?: string) {
  return db.query(
    `INSERT INTO branches (name, head_id) VALUES ($1, $2) RETURNING *`,
    [name, headId]
  );
}

export async function updateBranchModel(
  id: string,
  name?: string,
  headId?: string
) {
  return db.query(
    `UPDATE departments SET name = COALESCE($1, name), head_id = COALESCE($2, head_id), updated_at = NOW() WHERE id = $3 RETURNING *`,
    [name, headId, id]
  );
}
