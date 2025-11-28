import { db } from "../db";

export async function getUsersModel() {
  return db.query("SELECT * FROM users ORDER BY created_at DESC");
}

export async function getFormatedUsersModel() {
  const users = await db.query(`
    SELECT
        u.*,
        d.name as department_name,
        b.name as branch_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN branches b ON u.branch_id = b.id
      ORDER BY u.created_at DESC
    `);

  return users.rows.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: {
      id: user.department_id,
      name: user.department_name,
    },
    branch: {
      id: user.branch_id,
      name: user.branch_name,
    },
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }));
}

export async function getUserByEmail(email: string) {
  return db.query("SELECT * FROM users WHERE email = $1", [email]);
}

export async function getUserGroupModel(roles: string[]) {
  return db.query(
    "SELECT * FROM users WHERE role = ANY($1) ORDER BY created_at DESC",
    [roles]
  );
}

export async function getFormattedUsersByEmailModel(emails: string[]) {
  const users = await db.query("SELECT * FROM users WHERE id = ANY($1)", [
    emails,
  ]);
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

// export async function updateUserModel(
//   id: string,
//   name?: string,
//   email?: string,
//   username?: string,
//   role?: string,
//   password?: string,
//   departmentId?: string,
//   onboarded?: boolean
// ) {
//   return db.query(
//     `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), username = COALESCE($3, username), role = COALESCE($4, role), password = COALESCE($5, password), department_id = COALESCE($6, department_id), onboarded = COALESCE($7, onboarded), updated_at = NOW() WHERE id = $8 RETURNING *`,
//     [name, email, username, role, password, departmentId, onboarded, id]
//   );
// }
export async function updateUserModel(
  id: string,
  updates: {
    name?: string;
    email?: string;
    username?: string;
    role?: string;
    password?: string;
    departmentId?: string;
    onboarded?: boolean;
  }
) {
  const setClauses: string[] = ["updated_at = NOW()"];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.email !== undefined) {
    setClauses.push(`email = $${paramIndex++}`);
    values.push(updates.email);
  }
  if (updates.username !== undefined) {
    setClauses.push(`username = $${paramIndex++}`);
    values.push(updates.username);
  }
  if (updates.role !== undefined) {
    setClauses.push(`role = $${paramIndex++}`);
    values.push(updates.role);
  }
  if (updates.password !== undefined) {
    setClauses.push(`password = $${paramIndex++}`);
    values.push(updates.password);
  }
  if (updates.departmentId !== undefined) {
    setClauses.push(`department_id = $${paramIndex++}`);
    values.push(updates.departmentId);
  }
  if (updates.onboarded !== undefined) {
    setClauses.push(`onboarded = $${paramIndex++}`);
    values.push(updates.onboarded);
  }

  values.push(id);

  return db.query(
    `UPDATE users SET ${setClauses.join(
      ", "
    )} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
}

export async function getFormatedAuthUsersModel(userIds: string) {
  const user = await db.query(
    `
      SELECT 
        u.*,
        d.id as department_id,
        d.name as department_name,
        d.head_id as department_head_id,
        b.id as branch_id,
        b.name as branch_name,
        b.head_id as branch_head_id
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.id = $1
    `,
    [userIds]
  );
  const userWithDept = user.rows[0];

  // Format user object with department data
  const formattedUser = {
    id: userWithDept.id,
    name: userWithDept.name,
    email: userWithDept.email,
    onboarded: userWithDept.onboarded,
    role: userWithDept.role,
    created_at: userWithDept.created_at,
    updated_at: userWithDept.updated_at,
    department: userWithDept.department_id
      ? {
          id: userWithDept.department_id,
          name: userWithDept.department_name,
          head_id: userWithDept.department_head_id,
        }
      : null,
    branch: userWithDept.branch_id
      ? {
          id: userWithDept.branch_id,
          name: userWithDept.branch_name,
          head_id: userWithDept.branch_head_id,
        }
      : null,
    // ldapUser
  };
  return formattedUser;
}
