import { db } from "../db";

export async function getDepartmentsModel() {
  return db.query("SELECT * FROM departments ORDER BY created_at DESC");
}

export async function getFormatedDepartmentsModel(){
  const departments = await db.query(`
    SELECT
      d.*,
      u.name as head_name
    FROM departments d
    LEFT JOIN users u ON d.head_id = u.id
    ORDER BY d.created_at DESC
  `);
  return departments.rows.map(department => ({
    id: department.id,
    name: department.name,
    head: department.head_id ? {
      id: department.head_id,
      name: department.head_name
    } : null,
    createdAt: department.created_at,
    updatedAt: department.updated_at
  }));
}

export async function insertDepartmentModel(name: string, headId?: string) {
  return db.query(
    `INSERT INTO departments (name, head_id) VALUES ($1, $2) RETURNING *`,
    [name, headId]
  );
}

export async function updateDepartmentModel(
  id: string,
  name?: string,
  headId?: string
) {
  return db.query(
    `UPDATE departments SET name = COALESCE($1, name), head_id = COALESCE($2, head_id), updated_at = NOW() WHERE id = $3 RETURNING *`,
    [name, headId, id]
  );
}
