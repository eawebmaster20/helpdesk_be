import { Pool } from "pg";
import dotenv from "dotenv";

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
