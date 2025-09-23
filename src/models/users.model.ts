import { db } from "../db";

export async function getUsersModel() {
  return db.query("SELECT * FROM users ORDER BY created_at DESC");
}

export async function insertUserModel(
  name: string,
  email: string,
  role: string,
  departmentId?: string
) {
  return db.query(
    `INSERT INTO users (name, email, role, department_id) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, email, role, departmentId]
  );
}

export async function updateUserModel(
  id: string,
  name?: string,
  email?: string,
  role?: string,
  departmentId?: string
) {
  return db.query(
    `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), role = COALESCE($3, role), department_id = COALESCE($4, department_id), updated_at = NOW() WHERE id = $5 RETURNING *`,
    [name, email, role, departmentId, id]
  );
}
