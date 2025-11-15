import { Server, Socket } from "socket.io";
import { db } from "../db";
import { verifyUserToken } from "../middlewares/jwt.utils";
import { 
  addTicketActivityModel, 
  getFormatedL2TicketsModel, 
  getFormatedTicketsModel, 
  getTicketActivitiesModel 
} from "../models/ticket.model";

import { io as mainSocketServer} from "../index";
import { getFormatedUsersModel, getUsersModel } from "../models/users.model";
import { getFormatedBranchesModel } from "../models/branches.model";
import { getFormatedDepartmentsModel } from "../models/departments.model";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

export function newSetupHandlers(io: Server) {
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
    socket.on("standardUser", async (callback) => {
      socket.join(`tickets:l0`);
      console.log(`User ${socket.userEmail} joined room standardUser:tickets`);
      callback({
        success: true,
        data: [],
        message: "Subscribed to ticket list successfully"
      });
      if (socket.userId) {
        const userTickets = await getFormatedTicketsModel(socket.userId!);
        io.to(`tickets:l0`).emit(socket.userId, {
          success: true,
          data: userTickets,
          message: "Your ticket list has been retrieved successfully"
        });
      }
    });

    socket.on("user_l1", async (callback) => {
      socket.join(`tickets:l1`);
      console.log(`User ${socket.userEmail} joined room tickets:l1`);
      const tickets = await getFormatedTicketsModel();
      callback({
        success: true,
        data: tickets,
        message: "Subscribed to L1 ticket list successfully"
      });
    });

    socket.on("user_l2", async (callback) => {
      socket.join(`tickets:l2`);
      console.log(`User ${socket.userEmail} joined room tickets:l2`);
      const tickets = await getFormatedL2TicketsModel(socket.userId!);
      callback({
        success: true,
        data: tickets,
        message: "Subscribed to L2 ticket list successfully"
      });
    });

    socket.on("ticket:activities", async (ticketId: string, callback) => {
      socket.join(`tickets:l0`);
      socket.join(`tickets:l1`);
      socket.join(`tickets:l2`);
      try {
        const activities = await getTicketActivitiesModel(ticketId);
        callback({
          success: true,
          data: activities,
          message: "Ticket activities retrieved successfully"
        });
      } catch (error: any) {
        callback({
          success: false,
          message: "Error retrieving ticket activities",
          error: error.message
        });
      }
    });

    socket.on("user_l3", async (callback) => {
      socket.join(`tickets:l3`);
      console.log(`User ${socket.userEmail} joined room tickets:l3`);
      callback({
        success: true,
        data: [],
        message: "Subscribed to L3 ticket list successfully"
      });
      const data = await getFormatedUsersModel();
      const payload = {
        success: true,
        data,
        message: "Users retrieved successfully"
      }
      const branchesData = await getFormatedBranchesModel();
      const branchesPayload = {
        success: true,
        data: branchesData,
        message: "Branches retrieved successfully"
      }
      const departmentsData = await getFormatedDepartmentsModel();
      const departmentsPayload = {
        success: true,
        data: departmentsData,
        message: "Departments retrieved successfully"
      }
      emitL3(io, ['users:all'], payload);
      emitL3(io, ['branches:all'], branchesPayload);
      emitL3(io, ['departments:all'], departmentsPayload);
    });

    socket.on("disconnect", () => {
      console.log(` User ${socket.userEmail} disconnected from WebSocket`);
    });
  });
}

// export function setupTicketSocketHandlers(io: Server) {
  
  
//   io.use(async (socket: AuthenticatedSocket, next) => {
//     try {
//       const token = socket.handshake.auth.token;
      
//       if (!token) {
//         return next(new Error("Authentication token required"));
//       }
      
//       // Verify JWT token
//       const decoded = verifyUserToken(token);
//       socket.userId = decoded.id;
//       socket.userEmail = decoded.email;
      
//       next();
//     } catch (error) {
//       next(new Error("Invalid authentication token"));
//     }
//   });

//   io.on("connection", (socket: AuthenticatedSocket) => {

//     // Handle subscription to ticket created events
//     socket.on("tickets:subscribeToTicketCreated", async (callback) => {
//       // Only admin/managers should subscribe to all tickets
//       socket.join("tickets:created");
//       console.log(`User ${socket.userEmail} subscribed to CREATED tickets`);
//       callback({
//           success: true,
//           data: [],
//           message: "Tickets retrieved successfully"
//         });  
//     });

//     socket.on("tickets:subscribeTo:assignment", async (callback) => {
//       console.log(`User id is ${socket.userId} and email is ${socket.userEmail}`);

//       // Join a user-specific room for assignments
//       socket.join(`tickets:assignment:${socket.userId}`);
//       callback({
//         success: true,
//         data: [],
//         message: "Subscribed to ticket assignments successfully"
//       })
//     });


//     socket.on("tickets:subscribeToMyTicketUpdates", async (callback) => {
//       // Only admin/managers should subscribe to all tickets
//       socket.join(`ticket:update`);
//       console.log(`User ${socket.userEmail} subscribed to their ticket updates`);
//       io.to(`ticket:update`).emit(`user:${socket.userId}:ticket:update`, {
//           success: true,
//           data: [],
//           message: "Your ticket updates have been retrieved successfully"
//       });
//     });

//     socket.on("tickets:subscribeToAllTicketsUpdates", async (callback) => {
//       socket.join(`ticket:update`);
//       console.log(`User ${socket.userEmail} subscribed to all ticket updates`);
//       io.to(`ticket:update`).emit(`all:ticket:updates`, {
//           success: true,
//           data: [],
//           message: "Your ticket updates have been retrieved successfully"
//       });
//     });

//     // Handle subscription to different ticket views
//     socket.on("tickets:subscribeToAll", async (callback) => {
//       // Only admin/managers should subscribe to all tickets
//       socket.join("tickets:all");
//       console.log(`User ${socket.userEmail} subscribed to ALL tickets`);
      
//       // Send initial all tickets data
//       try {
//         const result = await db.query(`
//           SELECT 
//             t.*,
//             d.name as department_name,
//             d.id as department_id,
//             c.name as category_name,
//             c.description as category_description,
//             c.id as category_id,
//             u_creator.name as created_by_name,
//             u_creator.email as created_by_email,
//             u_assignee.name as assignee_name,
//             u_assignee.email as assignee_email,
//             u_assignee.id as assignee_id
//           FROM tickets t
//           LEFT JOIN departments d ON t.department_id = d.id
//           LEFT JOIN categories c ON t.category_id = c.id
//           LEFT JOIN users u_creator ON t.created_by = u_creator.id
//           LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
//           ORDER BY t.created_at DESC
//         `);
        
//         const transformedData = result.rows.map(row => ({
//           id: row.id,
//           ticket_number: row.ticket_number,
//           title: row.title,
//           description: row.description,
//           status: row.status,
//           priority: row.priority,
//           attachments: row.attachments,
//           created_at: row.created_at,
//           updated_at: row.updated_at,
//           department: row.department_id ? {
//             id: row.department_id,
//             name: row.department_name
//           } : null,
//           category: row.category_id ? {
//             id: row.category_id,
//             name: row.category_name,
//             description: row.category_description
//           } : null,
//           created_by: {
//             id: row.created_by,
//             name: row.created_by_name,
//             email: row.created_by_email
//           },
//           assignee: row.assignee_id ? {
//             id: row.assignee_id,
//             name: row.assignee_name,
//             email: row.assignee_email
//           } : null
//         }));

//         callback({
//           success: true,
//           data: transformedData,
//           message: "Tickets retrieved successfully"
//         });
        
//         console.log(`📨 Sent ${transformedData.length} tickets to ${socket.userEmail} (ALL)`);
//       } catch (error) {
//         console.error("Error sending all tickets:", error);
//         socket.emit("tickets:error", {
//           success: false,
//           error: "Failed to fetch all tickets"
//         });
//       }
//     });


//     // Handle subscription to user's own tickets
//     socket.on("tickets:subscribeToMine", async () => {
//       socket.join(socket.userId!);
      
//       // Send initial user tickets data
//       try {
//         const result = await db.query(`
//           SELECT 
//             t.*,
//             d.name as department_name,
//             d.id as department_id,
//             c.name as category_name,
//             c.description as category_description,
//             c.id as category_id,
//             u_creator.name as created_by_name,
//             u_creator.email as created_by_email,
//             u_assignee.name as assignee_name,
//             u_assignee.email as assignee_email,
//             u_assignee.id as assignee_id
//           FROM tickets t
//           LEFT JOIN departments d ON t.department_id = d.id
//           LEFT JOIN categories c ON t.category_id = c.id
//           LEFT JOIN users u_creator ON t.created_by = u_creator.id
//           LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
//           WHERE t.created_by = $1 OR t.assignee_id = $1
//           ORDER BY t.created_at DESC
//         `, [socket.userId]);
        
//         const transformedData = result.rows.map(row => ({
//           id: row.id,
//           ticket_number: row.ticket_number,
//           title: row.title,
//           description: row.description,
//           status: row.status,
//           priority: row.priority,
//           attachments: row.attachments,
//           created_at: row.created_at,
//           updated_at: row.updated_at,
//           department: row.department_id ? {
//             id: row.department_id,
//             name: row.department_name
//           } : null,
//           category: row.category_id ? {
//             id: row.category_id,
//             name: row.category_name,
//             description: row.category_description
//           } : null,
//           created_by: {
//             id: row.created_by,
//             name: row.created_by_name,
//             email: row.created_by_email
//           },
//           assignee: row.assignee_id ? {
//             id: row.assignee_id,
//             name: row.assignee_name,
//             email: row.assignee_email
//           } : null
//         }));

//         socket.emit(socket.userId!, {
//           success: true,
//           data: transformedData,
//           message: "Your tickets loaded",
//           timestamp: new Date().toISOString()
//         });
        
//       } catch (error) {
//         console.error("Error sending user tickets:", error);
//         socket.emit("tickets:error", {
//           success: false,
//           error: "Failed to fetch your tickets"
//         });
//       }
//     });

//     socket.on("tickets:getAll", async (callback) => {
//       try {
//         console.log('----------here ---------------')
//         const result = await db.query(`
//           SELECT 
//             t.*,
//             d.name as department_name,
//             d.id as department_id,
//             c.name as category_name,
//             c.description as category_description,
//             c.id as category_id,
//             u_creator.name as created_by_name,
//             u_creator.email as created_by_email,
//             u_assignee.name as assignee_name,
//             u_assignee.email as assignee_email,
//             u_assignee.id as assignee_id
//           FROM tickets t
//           LEFT JOIN departments d ON t.department_id = d.id
//           LEFT JOIN categories c ON t.category_id = c.id
//           LEFT JOIN users u_creator ON t.created_by = u_creator.id
//           LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
//           ORDER BY t.created_at DESC
//         `);
        
//         // Transform the data to include nested objects
//         const transformedData = result.rows.map(row => ({
//           id: row.id,
//           ticket_number: row.ticket_number,
//           title: row.title,
//           description: row.description,
//           status: row.status,
//           priority: row.priority,
//           attachments: row.attachments,
//           created_at: row.created_at,
//           updated_at: row.updated_at,
//           department: row.department_id ? {
//             id: row.department_id,
//             name: row.department_name
//           } : null,
//           category: row.category_id ? {
//             id: row.category_id,
//             name: row.category_name,
//             description: row.category_description
//           } : null,
//           created_by: {
//             id: row.created_by,
//             name: row.created_by_name,
//             email: row.created_by_email
//           },
//           assignee: row.assignee_id ? {
//             id: row.assignee_id,
//             name: row.assignee_name,
//             email: row.assignee_email
//           } : null
//         }));

//         callback({
//           success: true,
//           data: transformedData,
//           message: "Tickets retrieved successfully"
//         });
//       } catch (error) {
//         console.error("Error fetching tickets via WebSocket:", error);
//         callback({
//           success: false,
//           error: "Failed to fetch tickets",
//           message: "Database error occurred"
//         });
//       }
//     });

//     // Handle getting user's tickets (replaces GET /api/v1/tickets/user/:userId)
//     socket.on("tickets:getUserTickets", async (userId: string, callback) => {
//       try {
//         const result = await db.query(`
//           SELECT 
//             t.*,
//             d.name as department_name,
//             d.id as department_id,
//             c.name as category_name,
//             c.description as category_description,
//             c.id as category_id,
//             u_creator.name as created_by_name,
//             u_creator.email as created_by_email,
//             u_assignee.name as assignee_name,
//             u_assignee.email as assignee_email,
//             u_assignee.id as assignee_id
//           FROM tickets t
//           LEFT JOIN departments d ON t.department_id = d.id
//           LEFT JOIN categories c ON t.category_id = c.id
//           LEFT JOIN users u_creator ON t.created_by = u_creator.id
//           LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
//           WHERE t.created_by = $1
//           ORDER BY t.created_at DESC
//         `, [userId]);
        
//         // Transform the data (same as getAll)
//         const transformedData = result.rows.map(row => ({
//           id: row.id,
//           ticket_number: row.ticket_number,
//           title: row.title,
//           description: row.description,
//           status: row.status,
//           priority: row.priority,
//           attachments: row.attachments,
//           created_at: row.created_at,
//           updated_at: row.updated_at,
//           department: row.department_id ? {
//             id: row.department_id,
//             name: row.department_name
//           } : null,
//           category: row.category_id ? {
//             id: row.category_id,
//             name: row.category_name,
//             description: row.category_description
//           } : null,
//           created_by: {
//             id: row.created_by,
//             name: row.created_by_name,
//             email: row.created_by_email
//           },
//           assignee: row.assignee_id ? {
//             id: row.assignee_id,
//             name: row.assignee_name,
//             email: row.assignee_email
//           } : null
//         }));

//         callback({
//           success: true,
//           data: transformedData,
//           message: "User tickets retrieved successfully"
//         });
//       } catch (error) {
//         console.error("Error fetching user tickets via WebSocket:", error);
//         callback({
//           success: false,
//           error: "Failed to fetch user tickets",
//           message: "Database error occurred"
//         });
//       }
//     });

//     // Handle getting single ticket by ID (replaces GET /api/v1/tickets/:id)
//     socket.on("tickets:getById", async (ticketId: string, callback) => {
//       try {
//         const result = await db.query(`
//           SELECT 
//             t.*,
//             d.name as department_name,
//             d.id as department_id,
//             c.name as category_name,
//             c.description as category_description,
//             c.id as category_id,
//             u_creator.name as created_by_name,
//             u_creator.email as created_by_email,
//             u_assignee.name as assignee_name,
//             u_assignee.email as assignee_email,
//             u_assignee.id as assignee_id
//           FROM tickets t
//           LEFT JOIN departments d ON t.department_id = d.id
//           LEFT JOIN categories c ON t.category_id = c.id
//           LEFT JOIN users u_creator ON t.created_by = u_creator.id
//           LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
//           WHERE t.id = $1
//         `, [ticketId]);
        
//         if (result.rowCount === 0) {
//           return callback({
//             success: false,
//             error: "Ticket not found",
//             message: "The requested ticket does not exist"
//           });
//         }
        
//         const row = result.rows[0];
        
//         // Transform the data to include nested objects
//         const transformedData = {
//           id: row.id,
//           ticket_number: row.ticket_number,
//           title: row.title,
//           description: row.description,
//           status: row.status,
//           priority: row.priority,
//           attachments: row.attachments,
//           created_at: row.created_at,
//           updated_at: row.updated_at,
//           department: row.department_id ? {
//             id: row.department_id,
//             name: row.department_name
//           } : null,
//           category: row.category_id ? {
//             id: row.category_id,
//             name: row.category_name,
//             description: row.category_description
//           } : null,
//           created_by: {
//             id: row.created_by,
//             name: row.created_by_name,
//             email: row.created_by_email
//           },
//           assignee: row.assignee_id ? {
//             id: row.assignee_id,
//             name: row.assignee_name,
//             email: row.assignee_email
//           } : null
//         };

//         callback({
//           success: true,
//           data: transformedData,
//           message: "Ticket retrieved successfully"
//         });
//       } catch (error) {
//         console.error("Error fetching ticket by ID via WebSocket:", error);
//         callback({
//           success: false,
//           error: "Failed to fetch ticket",
//           message: "Database error occurred"
//         });
//       }
//     });

//     // Handle getting ticket activities (replaces GET /api/v1/tickets/:id/activities)
//     socket.on("tickets:getActivities", async (ticketId: string, callback) => {
//       try {
//         const result = await getTicketActivitiesModel(ticketId);
        
//         callback({
//           success: true,
//           data: result,
//           message: "Ticket activities retrieved successfully"
//         });
//       } catch (error) {
//         console.error("Error fetching ticket activities via WebSocket:", error);
//         callback({
//           success: false,
//           error: "Failed to fetch ticket activities",
//           message: "Database error occurred"
//         });
//       }
//     });

//     // Handle disconnection
//     socket.on("disconnect", () => {
//       console.log(`🔌 User ${socket.userEmail} disconnected from WebSocket`);
//     });
//   });
// }



export function emitTicketUpdate(io: Server, userId: string, eventList: string[], data: any) {
  for (const event of eventList) {
    console.log("Emitting to ticket update room ticket:updated and topic: ", event);
    io.to(['tickets:l0', 'tickets:l1', 'tickets:l2']).emit(event, data);
  }
}

export function emitTicketActivityUpdate(io: Server, eventList: string[], data: any) {
  for (const event of eventList) {
    console.log("Emitting to ticket activity update room:", event);
    io.to(['tickets:l0', 'tickets:l1', 'tickets:l2']).emit(event, data);
  }
}


export function emitTicketCreatedEvent(io: Server, userId: string, eventList: string[], data: any) {
  for (const event of eventList) {
    console.log("Emitting to created tickets room:", event);
    io.to(['tickets:l0', 'tickets:l1']).emit(event, data);
  }
}

export function emitUserTicketAssign(io: Server, userId: string, eventList: string[], data: any) {
  for (const event of eventList) {
    console.log("Emitting ticket assignment to: ", event);
    io.to(['tickets:l0', 'tickets:l1', 'tickets:l2']).emit(event, data);
  }
}

export function emitL3(io: Server, eventList: string[], data: any) {
  for (const event of eventList) {
    console.log("Emitting to L3 tickets room:", event);
    io.to('tickets:l3').emit(event, data);
  }
}
