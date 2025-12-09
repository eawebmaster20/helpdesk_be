import { Server, Socket } from "socket.io";
import { db } from "../db";
import { verifyUserToken } from "../middlewares/jwt.utils";
import {
  addTicketActivityModel,
  getFormatedL2TicketsModel,
  getFormatedTicketsModel,
  getMonthlyTicketCategoryModel,
  getTicketActivitiesModel,
  getTotalTicketsModel,
} from "../models/ticket.model";

import { io as mainSocketServer } from "../index";
import {
  getFormatedUsersModel,
  getTotalUserSummaryPayload,
  getUsersModel,
} from "../models/users.model";
import { getFormatedBranchesModel } from "../models/branches.model";
import { getFormatedDepartmentsModel } from "../models/departments.model";
import { tickets } from "../storage/memory";
import { emit } from "process";
import {
  getLastXTicketsByDateUpdated,
  getMonthlyTicketSummary,
  getTicketCategoryMonthlySummary,
  getTicketsPerBranchSummary,
  getTotalTicketCategorySummary,
  getTotalTicketStatusSummary,
} from "../controllers/tickets.controller";
import { get } from "http";

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
      next(
        new Error(
          error instanceof Error ? error.message : "Authentication error"
        )
      );
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    socket.on("standardUser", async (callback) => {
      socket.join(`tickets:l0`);
      console.log(`User ${socket.userEmail} joined room standardUser:tickets`);
      callback({
        success: true,
        data: [],
        message: "Subscribed to ticket list successfully",
      });
      if (socket.userId) {
        const userTickets = await getFormatedTicketsModel(socket.userId!);
        io.to(`tickets:l0`).emit(socket.userId, {
          success: true,
          data: userTickets,
          message: "Your ticket list has been retrieved successfully",
        });
      }
    });

    socket.on("user_l1", async (callback) => {
      socket.join(`tickets:l1`);
      console.log(`User ${socket.userEmail} joined room tickets:l1`);
      const myAssignedTickets = await getFormatedL2TicketsModel(socket.userId!);
      io.to(`${socket.userId}:ticket:assign`).emit(socket.userId!, {
        success: true,
        data: myAssignedTickets,
        message: "Your assigned tickets have been retrieved successfully",
      });
      const tickets = await getFormatedTicketsModel();
      callback({
        success: true,
        data: tickets,
        message: "Subscribed to L1 ticket list successfully",
      });
    });

    socket.on("user_l2", async (callback) => {
      socket.join(`tickets:l2`);
      console.log(`User ${socket.userEmail} joined room tickets:l2`);
      const tickets = await getFormatedL2TicketsModel(socket.userId!);
      callback({
        success: true,
        data: tickets,
        message: "Subscribed to L2 ticket list successfully",
      });
    });

    socket.on("get:l1_assigned_tickets", async (callback) => {
      try {
        const myAssignedTickets = await getFormatedL2TicketsModel(
          socket.userId!
        );
        callback({
          success: true,
          data: myAssignedTickets,
          message: "Your assigned tickets have been retrieved successfully",
        });
      } catch (error: any) {
        callback({
          success: false,
          message: "Error retrieving assigned tickets",
          error: error.message,
        });
      }
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
          message: "Ticket activities retrieved successfully",
        });
      } catch (error: any) {
        callback({
          success: false,
          message: "Error retrieving ticket activities",
          error: error.message,
        });
      }
    });

    socket.on("user_l3", async (callback) => {
      socket.join(`tickets:l3`);
      console.log(`User ${socket.userEmail} joined room tickets:l3`);
      callback({
        success: true,
        data: [],
        message: "Subscribed to L3 ticket list successfully",
      });
      const data = await getFormatedUsersModel();
      const payload = {
        success: true,
        data,
        message: "Users retrieved successfully",
      };
      const branchesData = await getFormatedBranchesModel();
      const branchesPayload = {
        success: true,
        data: branchesData,
        message: "Branches retrieved successfully",
      };
      const departmentsData = await getFormatedDepartmentsModel();
      const departmentsPayload = {
        success: true,
        data: departmentsData,
        message: "Departments retrieved successfully",
      };
      const totalTickets = await getTotalTicketsModel();
      const ticketsPayload = {
        success: true,
        data: totalTickets,
        message: "Total tickets retrieved successfully",
      };
      const monthlyTicketsSummary = await getMonthlyTicketSummary();
      const monthlyTicketsSummaryPayload = {
        success: true,
        data: monthlyTicketsSummary,
        message: "Monthly tickets summary retrieved successfully",
      };
      const totalTicketCategorySummary = await getTotalTicketCategorySummary();
      const totalTicketCategorySummaryPayload = {
        success: true,
        data: totalTicketCategorySummary,
        message: "Total ticket category summary retrieved successfully",
      };
      const totalTicketStatusSummary = await getTotalTicketStatusSummary();
      const totalTicketStatusSummaryPayload = {
        success: true,
        data: totalTicketStatusSummary,
        message: "Total ticket status summary retrieved successfully",
      };
      const totalUserSummary = await getTotalUserSummaryPayload();
      const totalUserSummaryPayload = {
        success: true,
        data: totalUserSummary,
        message: "Total user summary retrieved successfully",
      };
      const ticketsPerBranch = await getTicketsPerBranchSummary();
      const ticketsPerBranchPayload = {
        success: true,
        data: ticketsPerBranch,
        message: "Tickets per branch summary retrieved successfully",
      };
      const last5UpdatedTickets = await getLastXTicketsByDateUpdated(5);
      const last5UpdatedTicketsPayload = {
        success: true,
        data: last5UpdatedTickets,
        message: "Last 5 updated tickets retrieved successfully",
      };
      const monthlyTicketCategorySummary =
        await getTicketCategoryMonthlySummary();
      const monthlyTicketCategorySummaryPayload = {
        success: true,
        data: monthlyTicketCategorySummary,
        message: "Monthly ticket category summary retrieved successfully",
      };

      emitL3(io, ["users:all"], payload);
      emitL3(io, ["users:total-summary"], totalUserSummaryPayload);
      emitL3(io, ["branches:all"], branchesPayload);
      emitL3(io, ["departments:all"], departmentsPayload);
      emitL3(io, ["tickets:all"], ticketsPayload);
      emitL3(io, ["tickets:monthly-summary"], monthlyTicketsSummaryPayload);
      emitL3(
        io,
        ["tickets:total-category-summary"],
        totalTicketCategorySummaryPayload
      );
      emitL3(
        io,
        ["tickets:monthly-category-summary"],
        monthlyTicketCategorySummaryPayload
      );
      emitL3(
        io,
        ["tickets:total-status-summary"],
        totalTicketStatusSummaryPayload
      );
      emitL3(io, ["tickets:total-per-branch-summary"], ticketsPerBranchPayload);
      emitL3(io, ["tickets:last-5-updated"], last5UpdatedTicketsPayload);
    });

    socket.on("disconnect", () => {
      console.log(` User ${socket.userEmail} disconnected from WebSocket`);
    });
  });
}

export function emitTicketUpdate(
  io: Server,
  userId: string,
  eventList: string[],
  data: any
) {
  for (const event of eventList) {
    console.log(
      "Emitting to ticket update room ticket:updated and topic: ",
      event
    );
    io.to(["tickets:l0", "tickets:l1", "tickets:l2"]).emit(event, data);
  }
}

export function emitTicketActivityUpdate(
  io: Server,
  eventList: string[],
  data: any
) {
  for (const event of eventList) {
    console.log("Emitting to ticket activity update room:", event);
    io.to(["tickets:l0", "tickets:l1", "tickets:l2"]).emit(event, data);
  }
}

export async function emitTicketCreatedEvent(
  io: Server,
  userId: string,
  eventList: string[],
  data: any
) {
  const totalTickets = await getTotalTicketsModel();
  const ticketsPayload = {
    success: true,
    data: totalTickets,
    message: "Total tickets retrieved successfully",
  };
  emitL3(mainSocketServer, ["tickets:all"], ticketsPayload);
  for (const event of eventList) {
    console.log("Emitting to created tickets room:", event);
    io.to(["tickets:l0", "tickets:l1"]).emit(event, data);
  }
}

export function emitUserTicketAssign(
  io: Server,
  userId: string,
  eventList: string[],
  data: any
) {
  for (const event of eventList) {
    console.log("Emitting ticket assignment to: ", event);
    io.to(["tickets:l0", "tickets:l1", "tickets:l2"]).emit(event, data);
  }
}

export function emitL3(io: Server, eventList: string[], data: any) {
  for (const event of eventList) {
    console.log("Emitting to L3 tickets room:", event);
    io.to("tickets:l3").emit(event, data);
  }
}

export async function pushUserListUpdateToAdminDashboard() {
  const data = await getFormatedUsersModel();
  const allUsers = {
    success: true,
    data,
    message: "Users retrieved successfully",
  };
  emitL3(mainSocketServer, ["users:all"], allUsers);
}

// export async function pushUserListUpdateToAdminDashboard(){

//   const totalTickets = await getTotalTicketsModel();
//       const ticketsPayload = {
//         success: true,
//         data: totalTickets,
//         message: "Total tickets retrieved successfully"
//       };
//   emitL3(mainSocketServer, ['tickets:all'], ticketsPayload);
// }
