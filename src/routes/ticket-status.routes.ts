import { Router } from "express";
import { createBulkTicketStatuses, createTicketStatus, deleteTicketStatus, getTicketStatuses, updateTicketStatus } from "../controllers/ticket-status.controller";

const router = Router();


// POST /tickets/priority
router.post("/", createTicketStatus);

// POST /tickets/priority/bulk
router.post("/bulk", createBulkTicketStatuses);
    
// GET /tickets/priority
router.get("/", getTicketStatuses);

// PUT /tickets/priority/:id
router.put("/:id", updateTicketStatus);

// DELETE /tickets/priority/:id
router.delete("/:id", deleteTicketStatus);

export default router;