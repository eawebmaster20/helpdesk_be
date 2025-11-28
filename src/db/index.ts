import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path/win32";
import fs from "fs";

dotenv.config();

export const db = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Optional: Log connection success/failure
(async () => {
  try {
    await db.query("SELECT 1");
    console.log("Database connection established");
  } catch (err) {
    console.error("Database connection failed", err);
  }
})();

export async function initializeDatabase(): Promise<void> {
  const schema = fs.readFileSync(
    path.join(__dirname, "schema.sql"),
    "utf-8"
  );
  try {
    await db.query(schema);
    
    // create default branch (check if exists first)
    let branch = await db.query(
      `SELECT * FROM branches WHERE name = $1`,
      [process.env.DEFAULT_BRANCH_NAME || "Head Office"]
    );
    
    if (branch.rows.length === 0) {
      branch = await db.query(
        `INSERT INTO branches (name) VALUES ($1) RETURNING *`,
        [process.env.DEFAULT_BRANCH_NAME || "Head Office"]
      );
    }
    
    // create default department (check if exists first)
    let department = await db.query(
      `SELECT * FROM departments WHERE name = $1`,
      [process.env.DEFAULT_DEPARTMENT_NAME || "IT"]
    );
    
    if (department.rows.length === 0) {
      department = await db.query(
        `INSERT INTO departments (name) VALUES ($1) RETURNING *`,
        [process.env.DEFAULT_DEPARTMENT_NAME || "IT"]
      );
    }
    
    // set admin account (email has unique constraint, so ON CONFLICT works here)
    await db.query(
      `INSERT INTO users (name, email, username, role, department_id, branch_id, onboarded) VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING`,
      [
        process.env.ADMIN_NAME || "Admin User",
        process.env.ADMIN_EMAIL || "",
        process.env.ADMIN_USERNAME || "admin",
        process.env.ADMIN_ROLE || "3",
        department.rows[0].id,
        branch.rows[0].id,
        process.env.ADMIN_ONBOARDED || true
      ]
    );
    console.log("Database tables ensured.");
  } catch (err) {
    console.error("Failed to initialize database:", err);
    throw err;
  }
}

export async function resetDatabase(): Promise<void> {
  try {
    // PostgreSQL way to drop tables with foreign key constraints
    // Use CASCADE to automatically drop dependent objects
    await db.query("DROP TABLE IF EXISTS ticket_activities CASCADE");
    await db.query("DROP TABLE IF EXISTS kb_articles CASCADE");
    await db.query("DROP TABLE IF EXISTS automations CASCADE");
    await db.query("DROP TABLE IF EXISTS sla_compliance CASCADE");
    // await db.query("DROP TABLE IF EXISTS sla_policies CASCADE");
    // await db.query("DROP TABLE IF EXISTS forms CASCADE");
    await db.query("DROP TABLE IF EXISTS ticket_attachments CASCADE");
    await db.query("DROP TABLE IF EXISTS tickets CASCADE");
    // await db.query("DROP TABLE IF EXISTS ticket_priorities CASCADE");
    // await db.query("DROP TABLE IF EXISTS ticket_statuses CASCADE");
    // await db.query("DROP TABLE IF EXISTS categories CASCADE");
    await db.query("DROP TABLE IF EXISTS ticket_counter CASCADE");
    await db.query("DROP TABLE IF EXISTS branches CASCADE");
    await db.query("DROP TABLE IF EXISTS departments CASCADE");
    await db.query("DROP TABLE IF EXISTS users CASCADE");
    console.log("Database reset successfully.");
  } catch (error) {
    console.error("Failed to reset database:", error);
  }
}
