import { Router } from "express";
import { createBulkTicketPriorities, createTicketPriority, deleteTicketPriority, getTicketPriorities, updateTicketPriority } from "../controllers/ticket-priority.controller";

const router = Router();


// POST /tickets/priority
router.post("/", createTicketPriority);

// POST /tickets/priority/bulk
router.post("/bulk", createBulkTicketPriorities);

// GET /tickets/priority
router.get("/", getTicketPriorities);

// PUT /tickets/priority/:id
router.put("/:id", updateTicketPriority);

// DELETE /tickets/priority/:id
router.delete("/:id", deleteTicketPriority);

export default router;