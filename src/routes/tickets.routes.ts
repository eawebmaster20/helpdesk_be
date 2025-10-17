import { Router } from "express";
import {
  getTickets,
  createTicket,
  getTicketById,
  updateTicket,
  addTicketComment,
  addTicketAttachment,
  assignTicket,
  transitionTicket,
  linkTicket,
  getTicketsByUser
} from "../controllers/tickets.controller";

const router = Router();

// GET /tickets
router.get("/", getTickets);

// GET /tickets/:user by user
router.get("/user/:userId", getTicketsByUser);

// POST /tickets
router.post("/", createTicket);

// GET /tickets/:id
router.get("/:id", getTicketById);

router.patch("/:id", updateTicket);

// POST /tickets/:id/comments
router.post("/:id/comments", addTicketComment);

// POST /tickets/:id/attachments
router.post("/:id/attachments", addTicketAttachment);

// POST /tickets/:id/assign
router.post("/:id/assign", assignTicket);

// POST /tickets/:id/transition
router.post("/:id/transition", transitionTicket);

// POST /tickets/:id/link
router.post("/:id/link", linkTicket);

export default router;
