import { Department, User, Ticket } from "../models/ticket.model";
import {
  KBArticle,
  Category,
  Form,
  SLAPolicy,
  Automation,
} from "../models/admin.model";
import { v4 as uuidv4 } from "uuid";

// In-memory storage
export const departments: Department[] = [];
export const users: User[] = [];
export const tickets: Ticket[] = [];
export const kbArticles: KBArticle[] = [];
export const categories: Category[] = [];
export const forms: Form[] = [];
export const slaPolicies: SLAPolicy[] = [];
export const automations: Automation[] = [];

// Helper to generate unique IDs
export const generateId = () => uuidv4();
