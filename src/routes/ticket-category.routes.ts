import { Router } from "express";
import { createTicketCategory, deleteTicketCategory, getTicketCategories, updateTicketCategory } from "../controllers/ticket-category.controller";

const router = Router();


// POST /tickets/category
router.post("/", createTicketCategory);

// GET /tickets/category
router.get("/", getTicketCategories);

// PUT /tickets/category/:id
router.put("/:id", updateTicketCategory);

// DELETE /tickets/category/:id
router.delete("/:id", deleteTicketCategory);

export default router;