import { Server, Socket } from "socket.io";
import { db } from "../db";
import { verifyUserToken } from "../middlewares/jwt.utils";
import { 
  addTicketActivityModel, 
  getTicketActivitiesModel 
} from "../models/ticket.model";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}


export function setupTicketSocketHandlers(io: Server) {
  
  
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error("Authentication token required"));
      }
      
      // Verify JWT token
      const decoded = verifyUserToken(token);
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;
      
      next();
    } catch (error) {
      next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {

    // Handle subscription to ticket created events
    socket.on("tickets:subscribeToTicketCreated", async (callback) => {
      // Only admin/managers should subscribe to all tickets
      socket.join("tickets:created");
      console.log(`User ${socket.userEmail} subscribed to CREATED tickets`);
      callback({
          success: true,
          data: [],
          message: "Tickets retrieved successfully"
        });  
    });

    socket.on("tickets:subscribeTo:assignment", async (callback) => {
      console.log(`User id is ${socket.userId} and email is ${socket.userEmail}`);

      // Join a user-specific room for assignments
      socket.join(`tickets:assignment:${socket.userId}`);
      callback({
        success: true,
        data: [],
        message: "Subscribed to ticket assignments successfully"
      })
    });


    socket.on("tickets:subscribeToMyTicketUpdates", async (callback) => {
      // Only admin/managers should subscribe to all tickets
      socket.join(`ticket:update`);
      console.log(`User ${socket.userEmail} subscribed to their ticket updates`);
      io.to(`ticket:update`).emit(`user:${socket.userId}:ticket:update`, {
          success: true,
          data: [],
          message: "Your ticket updates have been retrieved successfully"
      });
    });

    socket.on("tickets:subscribeToAllTicketsUpdates", async (callback) => {
      socket.join(`ticket:update`);
      console.log(`User ${socket.userEmail} subscribed to all ticket updates`);
      io.to(`ticket:update`).emit(`all:ticket:updates`, {
          success: true,
          data: [],
          message: "Your ticket updates have been retrieved successfully"
      });
    });

    // Handle subscription to different ticket views
    socket.on("tickets:subscribeToAll", async (callback) => {
      // Only admin/managers should subscribe to all tickets
      socket.join("tickets:all");
      console.log(`User ${socket.userEmail} subscribed to ALL tickets`);
      
      // Send initial all tickets data
      try {
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

        callback({
          success: true,
          data: transformedData,
          message: "Tickets retrieved successfully"
        });
        
        console.log(`📨 Sent ${transformedData.length} tickets to ${socket.userEmail} (ALL)`);
      } catch (error) {
        console.error("Error sending all tickets:", error);
        socket.emit("tickets:error", {
          success: false,
          error: "Failed to fetch all tickets"
        });
      }
    });


    // Handle subscription to user's own tickets
    socket.on("tickets:subscribeToMine", async () => {
      socket.join(`tickets:user:${socket.userId}`);
      console.log(`👤 User ${socket.userId} subscribed to THEIR tickets`);
      
      // Send initial user tickets data
      try {
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
          WHERE t.created_by = $1 OR t.assignee_id = $1
          ORDER BY t.created_at DESC
        `, [socket.userId]);
        
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

        socket.emit(`tickets:user:${socket.userId}`, {
          success: true,
          data: transformedData,
          message: "Your tickets loaded",
          timestamp: new Date().toISOString()
        });
        
        console.log(`📨 Sent ${transformedData.length} tickets to ${socket.userEmail} (MINE)`);
      } catch (error) {
        console.error("Error sending user tickets:", error);
        socket.emit("tickets:error", {
          success: false,
          error: "Failed to fetch your tickets"
        });
      }
    });

    socket.on("tickets:getAll", async (callback) => {
      try {
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
        
        // Transform the data to include nested objects
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

        callback({
          success: true,
          data: transformedData,
          message: "Tickets retrieved successfully"
        });
      } catch (error) {
        console.error("Error fetching tickets via WebSocket:", error);
        callback({
          success: false,
          error: "Failed to fetch tickets",
          message: "Database error occurred"
        });
      }
    });

    // Handle getting user's tickets (replaces GET /api/v1/tickets/user/:userId)
    socket.on("tickets:getUserTickets", async (userId: string, callback) => {
      try {
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
          WHERE t.created_by = $1
          ORDER BY t.created_at DESC
        `, [userId]);
        
        // Transform the data (same as getAll)
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

        callback({
          success: true,
          data: transformedData,
          message: "User tickets retrieved successfully"
        });
      } catch (error) {
        console.error("Error fetching user tickets via WebSocket:", error);
        callback({
          success: false,
          error: "Failed to fetch user tickets",
          message: "Database error occurred"
        });
      }
    });

    // Handle getting single ticket by ID (replaces GET /api/v1/tickets/:id)
    socket.on("tickets:getById", async (ticketId: string, callback) => {
      try {
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
          WHERE t.id = $1
        `, [ticketId]);
        
        if (result.rowCount === 0) {
          return callback({
            success: false,
            error: "Ticket not found",
            message: "The requested ticket does not exist"
          });
        }
        
        const row = result.rows[0];
        
        // Transform the data to include nested objects
        const transformedData = {
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
        };

        callback({
          success: true,
          data: transformedData,
          message: "Ticket retrieved successfully"
        });
      } catch (error) {
        console.error("Error fetching ticket by ID via WebSocket:", error);
        callback({
          success: false,
          error: "Failed to fetch ticket",
          message: "Database error occurred"
        });
      }
    });

    // Handle getting ticket activities (replaces GET /api/v1/tickets/:id/activities)
    socket.on("tickets:getActivities", async (ticketId: string, callback) => {
      try {
        const result = await getTicketActivitiesModel(ticketId);
        
        // Transform the data to include nested user objects
        const transformedData = result.rows.map(row => ({
          id: row.id,
          ticket_id: row.ticket_id,
          type: row.type,
          action: row.action,
          comment: row.comment,
          created_at: row.created_at,
          user: {
            id: row.user_id,
            name: row.user_name,
            email: row.user_email
          }
        }));
        
        callback({
          success: true,
          data: transformedData,
          message: "Ticket activities retrieved successfully"
        });
      } catch (error) {
        console.error("Error fetching ticket activities via WebSocket:", error);
        callback({
          success: false,
          error: "Failed to fetch ticket activities",
          message: "Database error occurred"
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`🔌 User ${socket.userEmail} disconnected from WebSocket`);
    });
  });
}

export function emitTicketUpdateToL2User(io: Server, event: string, data: any) {
  console.log("Emitting to L2 user room:", event);
  io.to(`tickets:myList`).emit("tickets:myList", {
    success: true,
    data: data,
    message: "Your tickets loaded",
    timestamp: new Date().toISOString()
  });
}


export function emitTicketUpdate(io: Server, userId: string, eventList: string[], data: any) {
  for (const event of eventList) {
    console.log("Emitting to ticket update room ticket:updated and topic: ", event);
    io.to(`ticket:update`).emit(event, data);
  }
}


export function emitTicketCreatedEvent(io: Server, userId: string, event: string, data: any) {
  console.log("Emitting to created tickets room:", event);
  io.to(['tickets:created', `tickets:user:${userId}`]).emit(event, data);
}

export function emitUserTicketAssign(io: Server, userId: string, event: string, data: any) { 
  io.to(`tickets:assignment:${userId}`).emit(`tickets:assignment:${userId}`, data);
  // io.sockets.adapter.rooms.forEach((value, key) => {
  //   console.log("confirming Room key:", key);
  // });
  // console.log(`User ${userId} is connected and in assignment room. Emitting...`);

  // Get all sockets in the user's assignment room
  // const room = io.sockets.adapter.rooms.get(`tickets:assignment:${userId}`);
  
  // if (room && room.size > 0) {
  // } else {
  //   console.log(`User ${userId} is not connected or not in assignment room. Saving for later or using fallback...`);
  //   // Option 1: Emit to a general room that admins/managers might be in
  //   io.to("tickets:newAssignment").emit(`tickets:assignedTo:${userId}`, {
  //     ...data,
  //     targetUserId: userId,
  //     note: "User was offline when assigned"
  //   });
    
    // Option 2: Store in database/cache for when user reconnects
    // await storeNotificationForUser(userId, data);
  // }
}
