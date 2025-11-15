import { db } from "../db";

export async function getBranchesModel() {
  return db.query("SELECT * FROM branches ORDER BY created_at DESC");
}

export async function getFormatedBranchesModel(){
  const branches = await db.query(`
    SELECT
      b.*,
      u.name as head_name
    FROM branches b
    LEFT JOIN users u ON b.head_id = u.id
    ORDER BY b.created_at DESC
  `);
  return branches.rows.map(branch => ({
    id: branch.id,
    name: branch.name,
    head: branch.head_id ? {
      id: branch.head_id,
      name: branch.head_name
    } : null,
    createdAt: branch.created_at,
    updatedAt: branch.updated_at
  }));
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
