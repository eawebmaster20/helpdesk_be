import { db } from "../db";

export async function getUsersModel() {
  return db.query("SELECT * FROM users ORDER BY created_at DESC");
}

export async function getUserByEmail(email: string) {
  return db.query("SELECT * FROM users WHERE email = $1", [email]);
}

export async function insertUserModel(
  name: string,
  email: string,
  role: string,
  password?: string,
  departmentId?: string
) {
  return db.query(
    `INSERT INTO users (name, email, password, role, department_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, email, password, role, departmentId]
  );
}

export async function updateUserModel(
  id: string,
  name?: string,
  email?: string,
  role?: string,
  password?: string,
  departmentId?: string
) {
  return db.query(
    `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), password = COALESCE($3, password), role = COALESCE($4, role), department_id = COALESCE($5, department_id), updated_at = NOW() WHERE id = $6 RETURNING *`,
    [name, email, password, role, departmentId, id]
  );
}
