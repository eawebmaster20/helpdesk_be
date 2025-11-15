import { db } from "../db";

export async function getUsersModel() {
  return db.query("SELECT * FROM users ORDER BY created_at DESC");
}

export async function getFormatedUsersModel(){
  const users = await db.query(`
    SELECT
        u.*,
        d.name as department_name,
        b.name as branch_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN branches b ON u.branch_id = b.id
      ORDER BY u.created_at DESC
    `)

  return users.rows.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: {
      id: user.department_id,
      name: user.department_name
    },
    branch: {
      id: user.branch_id,
      name: user.branch_name
    },
    createdAt: user.created_at,
    updatedAt: user.updated_at
  }));
}

export async function getUserByEmail(email: string) {
  return db.query("SELECT * FROM users WHERE email = $1", [email]);
}

export async function getUserGroupModel(role: string) {
  return db.query("SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC", [role]);
}

export async function getFormattedUsersByEmailModel(emails: string[]) {
  const users = await db.query("SELECT * FROM users WHERE email = ANY($1)", [emails]);
  if (users.rowCount === 0) {
    return null;
  }
  return users.rows;
}

export async function insertUserModel(
  name: string,
  email: string,
  role: string,
  password?: string,
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
  username?: string,
  role?: string,
  password?: string,
  departmentId?: string
) {
  return db.query(
    `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), username = COALESCE($3, username), role = COALESCE($4, role), password = COALESCE($5, password), department_id = COALESCE($6, department_id), updated_at = NOW() WHERE id = $7 RETURNING *`,
    [name, email, username, role, password, departmentId, id]
  );
}
