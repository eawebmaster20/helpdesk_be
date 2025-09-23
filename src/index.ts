require("dotenv").config();

import express, { Application, Request, Response } from "express";

import authRoutes from "./routes/auth.routes";
import ticketsRoutes from "./routes/tickets.routes";
import approvalsRoutes from "./routes/approvals.routes";
import adminRoutes from "./routes/admin.routes";
import kbRoutes from "./routes/kb.routes";
import webhooksRoutes from "./routes/webhooks.routes";
import departmentsRoutes from "./routes/departments.routes";
import usersRoutes from "./routes/users.routes";
import cors from "cors";
import { db } from "./db/index";

const app: Application = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(
  cors({
    origin: "*", // Allow all origins for development; restrict in production
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/", (req: Request, res: Response) => {
  res.send("Helpdesk Be API is running");
});

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/tickets", ticketsRoutes);
app.use("/api/v1/approvals", approvalsRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/kb", kbRoutes);
app.use("/api/v1/webhooks", webhooksRoutes);
app.use("/api/v1/departments", departmentsRoutes);
app.use("/api/v1/users", usersRoutes);
app.get("/health", async (req, res) => {
  try {
    // Check database connection
    const connection = await db.connect();
    await connection.query("SELECT 1");
    connection.release();

    res.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error: any) {
    console.error("Health check database error:", error);
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      error:
        process.env.NODE_ENV === "production"
          ? "Database connection failed"
          : error.message,
    });
  }
});

// Global error handler
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Global error handler:", error);

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === "development";

    res.status(error.status || 500).json({
      error: isDevelopment ? error.message : "Internal server error",
      code: "INTERNAL_ERROR",
      ...(isDevelopment && { stack: error.stack }),
    });
  }
);

const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// Test connection
export const testConnection = async () => {
  try {
    const connection = await db.connect();
    console.log("✅ Database connected successfully");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
};

// Start server
const startServer = async () => {
  try {
    // Test database connection
    console.log("🔍 Testing database connection...");
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error(
        "❌ Database connection failed. Please check your database configuration."
      );
      process.exit(1);
    }

    // Initialize database tables
    // console.log("🏗️  Initializing database tables...");
    // await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log("\n Server is running!");
      console.log(` HTTP server: http://localhost:${PORT}`);
      console.log(` Health check: http://localhost:${PORT}//api/health`);
      console.log(` API base URL: http://localhost:${PORT}/api/v1`);
      console.log(` CORS enabled for: ${process.env.FRONTEND_URL}`);
      console.log(` Environment: ${process.env.NODE_ENV}\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
