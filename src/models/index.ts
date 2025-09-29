import { db } from "../db";
import fs from "fs";
import path from "path";

export async function initializeDatabase(): Promise<void> {
  const schemaPath = path.join(__dirname, "../db/schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  try {
    await db.query(schema);
    console.log("Database tables ensured.");
  } catch (err) {
    console.error("Failed to initialize database:", err);
    throw err;
  }
}
