import { Router } from "express";
import { createBulkTicketCategories, createTicketCategory, deleteTicketCategory, getTicketCategories, updateTicketCategory } from "../controllers/ticket-category.controller";

const router = Router();


// POST /tickets/category
router.post("/", createTicketCategory);

// POST /tickets/category/bulk
router.post("/bulk", createBulkTicketCategories);

// GET /tickets/category
router.get("/", getTicketCategories);

// PUT /tickets/category/:id
router.put("/:id", updateTicketCategory);

// DELETE /tickets/category/:id
router.delete("/:id", deleteTicketCategory);

export default router;