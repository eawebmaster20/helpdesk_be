import {
  createApprovalsModel,
  decideApprovalModel,
  getTicketApprovalsStatus,
  updateTicketStatus,
} from "../models/approvals.model";
import { Request, Response } from "express";

export async function createApprovals(req: Request, res: Response) {
  const { id } = req.params;
  const { steps } = req.body;
  const allowedSteps = ["department_head", "hr"];
  if (!Array.isArray(steps) || steps.length === 0) {
    return res.status(400).json({ message: "steps array required" });
  }
  const filteredSteps = steps.filter((step: any) =>
    allowedSteps.includes(step)
  );
  if (filteredSteps.length === 0) {
    return res
      .status(400)
      .json({ message: "No valid approval steps provided" });
  }
  try {
    // Optionally check ticket existence here if needed
    const insertedApprovals = await createApprovalsModel(id, filteredSteps);
    res.status(201).json(insertedApprovals);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}

export async function decideApproval(req: Request, res: Response) {
  const { id } = req.params;
  const { status, comment, decidedBy } = req.body;
  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  try {
    const result = await decideApprovalModel(id, status, comment, decidedBy);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Approval step not found" });
    }
    const approval = result.rows[0];
    const ticketId = approval.ticket_id;
    const approvalsResult = await getTicketApprovalsStatus(ticketId);
    const allApproved = approvalsResult.rows.every(
      (a: any) => a.status === "Approved"
    );
    const anyRejected = approvalsResult.rows.some(
      (a: any) => a.status === "Rejected"
    );
    let newStatus = null;
    if (anyRejected) {
      newStatus = "Rejected";
    } else if (allApproved) {
      newStatus = "Approved";
    }
    if (newStatus) {
      await updateTicketStatus(ticketId, newStatus);
    }
    res.json(approval);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err });
  }
}
