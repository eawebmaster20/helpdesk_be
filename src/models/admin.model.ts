export interface KBArticle {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdBy: string; // userId
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Form {
  id: string;
  name: string;
  schema: object;
}

export interface SLAPolicy {
  id: string;
  name: string;
  description?: string;
  responseTimeHours: number;
  resolutionTimeHours: number;
}

export interface Automation {
  id: string;
  name: string;
  trigger: string;
  action: string;
}

import { db } from "../db";

// FORM MODELS
export async function insertForm(name: string, schema: any) {
  return db.query(
    `INSERT INTO forms (name, schema) VALUES ($1, $2) RETURNING *`,
    [name, schema]
  );
}

export async function updateFormById(id: string, name?: string, schema?: any) {
  return db.query(
    `UPDATE forms SET name = COALESCE($1, name), schema = COALESCE($2, schema), updated_at = NOW() WHERE id = $3 RETURNING *`,
    [name, schema, id]
  );
}

// SLA POLICY MODELS
export async function getAllSLAPolicies() {
  return db.query("SELECT * FROM sla_policies ORDER BY created_at DESC");
}

export async function insertSLAPolicy(
  name: string,
  description: string,
  responseTimeHours: number,
  resolutionTimeHours: number
) {
  return db.query(
    `INSERT INTO sla_policies (name, description, response_time_hours, resolution_time_hours) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, description, responseTimeHours, resolutionTimeHours]
  );
}

export async function updateSLAPolicyById(
  id: string,
  name?: string,
  description?: string,
  responseTimeHours?: number,
  resolutionTimeHours?: number
) {
  return db.query(
    `UPDATE sla_policies SET name = COALESCE($1, name), description = COALESCE($2, description), response_time_hours = COALESCE($3, response_time_hours), resolution_time_hours = COALESCE($4, resolution_time_hours), updated_at = NOW() WHERE id = $5 RETURNING *`,
    [name, description, responseTimeHours, resolutionTimeHours, id]
  );
}

// CATEGORY MODELS
export async function getAllCategories() {
  return db.query("SELECT * FROM categories ORDER BY created_at DESC");
}

export async function insertCategory(name: string, description?: string) {
  return db.query(
    `INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *`,
    [name, description]
  );
}

export async function updateCategoryById(
  id: string,
  name?: string,
  description?: string
) {
  return db.query(
    `UPDATE categories SET name = COALESCE($1, name), description = COALESCE($2, description), updated_at = NOW() WHERE id = $3 RETURNING *`,
    [name, description, id]
  );
}
