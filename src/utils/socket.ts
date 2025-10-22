import { Server } from "socket.io";

// Global Socket.IO instance
let io: Server | null = null;

export const setSocketInstance = (socketInstance: Server) => {
  io = socketInstance;
};

export const getSocketInstance = (): Server | null => {
  return io;
};

// Helper functions that use the global socket instance
export const emitTicketUpdate = (event: string, data: any) => {
  if (io) {
    const clientsCount = io.sockets.adapter.rooms.get("tickets:all")?.size || 0;
    console.log(`📡 Emitting ${event} to tickets:all room (${clientsCount} clients)`);
    
    io.to("tickets:all").emit(event, data);
    
    console.log(`✅ Successfully emitted ${event} to tickets:all room`);
  } else {
    console.warn("⚠️ Socket.IO instance not available for emitTicketUpdate");
  }
};

export const emitUserTicketUpdate = (userId: string, event: string, data: any) => {
  if (io) {
    const roomName = `user:${userId}`;
    const clientsCount = io.sockets.adapter.rooms.get(roomName)?.size || 0;
    console.log(`📡 Emitting ${event} to ${roomName} (${clientsCount} clients)`);
    
    io.to(roomName).emit(event, data);
    
    console.log(`✅ Successfully emitted ${event} to ${roomName}`);
  } else {
    console.warn("⚠️ Socket.IO instance not available for emitUserTicketUpdate");
  }
};

// Function to emit updated tickets list to relevant dashboard clients
export const emitUpdatedTicketsList = async () => {
  if (!io) {
    console.warn("⚠️ Socket.IO instance not available for emitUpdatedTicketsList");
    return;
  }

  try {
    // Send updated ALL tickets to admin dashboards
    await emitAllTicketsUpdate();
    
    // Send updated MY tickets to individual users
    await emitUserTicketsUpdates();
    
    console.log(`✅ Successfully sent updated tickets lists to all relevant clients`);
  } catch (error) {
    console.error("❌ Error sending updated tickets list:", error);
  }
};

// Function to emit all tickets to admin/manager dashboards
export const emitAllTicketsUpdate = async () => {
  if (!io) return;

  try {
    const { db } = await import("../db");
    
    const result = await db.query(`
      SELECT 
        t.*,
        d.name as department_name,
        d.id as department_id,
        c.name as category_name,
        c.description as category_description,
        c.id as category_id,
        u_creator.name as created_by_name,
        u_creator.email as created_by_email,
        u_assignee.name as assignee_name,
        u_assignee.email as assignee_email,
        u_assignee.id as assignee_id
      FROM tickets t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u_creator ON t.created_by = u_creator.id
      LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
      ORDER BY t.created_at DESC
    `);
    
    const transformedData = result.rows.map(row => ({
      id: row.id,
      ticket_number: row.ticket_number,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      attachments: row.attachments,
      created_at: row.created_at,
      updated_at: row.updated_at,
      department: row.department_id ? {
        id: row.department_id,
        name: row.department_name
      } : null,
      category: row.category_id ? {
        id: row.category_id,
        name: row.category_name,
        description: row.category_description
      } : null,
      created_by: {
        id: row.created_by,
        name: row.created_by_name,
        email: row.created_by_email
      },
      assignee: row.assignee_id ? {
        id: row.assignee_id,
        name: row.assignee_name,
        email: row.assignee_email
      } : null
    }));

    const clientsCount = io.sockets.adapter.rooms.get("tickets:all")?.size || 0;
    console.log(`📡 Emitting ALL tickets to admin dashboards (${clientsCount} clients, ${transformedData.length} tickets)`);
    
    io.to("tickets:all").emit("tickets:allList", {
      success: true,
      data: transformedData,
      message: "All tickets updated",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Error sending all tickets update:", error);
  }
};

// Function to emit user-specific tickets to individual user dashboards
export const emitUserTicketsUpdates = async () => {
  if (!io) return;

  try {
    const { db } = await import("../db");
    
    // Get all unique user IDs that have tickets or are assigned tickets
    const usersResult = await db.query(`
      SELECT DISTINCT u.id
      FROM users u
      WHERE u.id IN (
        SELECT DISTINCT created_by FROM tickets
        UNION
        SELECT DISTINCT assignee_id FROM tickets WHERE assignee_id IS NOT NULL
      )
    `);

    // Send updated tickets to each user's personal dashboard
    for (const userRow of usersResult.rows) {
      const userId = userRow.id;
      const roomName = `tickets:user:${userId}`;
      
      // Check if user has any connected clients in their room
      const userClientsCount = io.sockets.adapter.rooms.get(roomName)?.size || 0;
      if (userClientsCount === 0) continue; // Skip if user not connected
      
      // Get user's tickets (created by them or assigned to them)
      const userTicketsResult = await db.query(`
        SELECT 
          t.*,
          d.name as department_name,
          d.id as department_id,
          c.name as category_name,
          c.description as category_description,
          c.id as category_id,
          u_creator.name as created_by_name,
          u_creator.email as created_by_email,
          u_assignee.name as assignee_name,
          u_assignee.email as assignee_email,
          u_assignee.id as assignee_id
        FROM tickets t
        LEFT JOIN departments d ON t.department_id = d.id
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN users u_creator ON t.created_by = u_creator.id
        LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
        WHERE t.created_by = $1 OR t.assignee_id = $1
        ORDER BY t.created_at DESC
      `, [userId]);
      
      const transformedUserData = userTicketsResult.rows.map(row => ({
        id: row.id,
        ticket_number: row.ticket_number,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        attachments: row.attachments,
        created_at: row.created_at,
        updated_at: row.updated_at,
        department: row.department_id ? {
          id: row.department_id,
          name: row.department_name
        } : null,
        category: row.category_id ? {
          id: row.category_id,
          name: row.category_name,
          description: row.category_description
        } : null,
        created_by: {
          id: row.created_by,
          name: row.created_by_name,
          email: row.created_by_email
        },
        assignee: row.assignee_id ? {
          id: row.assignee_id,
          name: row.assignee_name,
          email: row.assignee_email
        } : null
      }));

      console.log(`👤 Emitting ${transformedUserData.length} tickets to user ${userId} (${userClientsCount} clients)`);
      
      io.to(roomName).emit("tickets:myList", {
        success: true,
        data: transformedUserData,
        message: "Your tickets updated",
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("❌ Error sending user tickets updates:", error);
  }
};