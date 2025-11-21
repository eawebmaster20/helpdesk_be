import { createSLAModel, updateSLAModel, getSLAPolicyByIdModel, deleteSLAPolicyByIdModel, getAllSLAPoliciesModel, createBulkSLAModel } from "../models/sla.model";
import { Request, Response } from "express";
import { SLAPolicy } from "../types/sla";
// import { getSLAComplianceByTicketIdModel } from "../models/ticket.model";

// create sla policy
export async function createSLAPolicy(req: Request, res: Response) {
  const { name, responseTimeHours, resolutionTimeHours } = req.body;
  const result = await createSLAModel(name, responseTimeHours, resolutionTimeHours);
  res.json({
      data: result,
      message: 'SLA Policy created successfully',
      status: 'success'
  });
}

export async function createBulkSLApolicies(req: Request, res: Response) {
  const { slaPolicies } = req.body;

  try {
    const result = await createBulkSLAModel(slaPolicies);
    res.json({
      data: result,
      message: 'SLA Policies created successfully',
      status: 'success'
    });
  } catch (error) {
    res.status(500).json({ message: "Database error", error });
  }
}

// update sla policy
export async function updateSLAPolicy(req: Request, res: Response){
  const { slaPolicyId, name, description, responseTimeHours, resolutionTimeHours } = req.body;
  const result = await updateSLAModel(slaPolicyId, name, description, responseTimeHours, resolutionTimeHours);
    res.json({
      data: result,
      message: 'SLA Policy updated successfully',
      status: 'success'
  });
}


// apply sla policy to ticket
export async function applySLAPolicyToTicket(req: Request, res: Response) {
  const { ticketId, slaPolicyId } = req.body;
  await applySLAPolicyToTicket(ticketId, slaPolicyId);
  res.json({
      message: 'SLA Policy applied to ticket successfully',
      status: 'success'
  });
}


// get all sla policies
export async function getAllSLAPolicies(req: Request, res: Response) {
  const result = await getAllSLAPoliciesModel();
  res.json({
      data: result,
      message: 'SLA Policies retrieved successfully',
      status: 'success'
  });
}

// get sla policy by id
export async function getSLAPolicyById(req: Request, res: Response){
  const { id } = req.params;
  const result = await getSLAPolicyByIdModel(id);
  res.json({
      data: result,
      message: 'SLA Policy retrieved successfully',
      status: 'success'
  });
}

// delete sla policy by id
export async function deleteSLAPolicyById(req: Request, res: Response) {
  const { id } = req.params;
  await deleteSLAPolicyByIdModel(id);
  res.json({
      message: 'SLA Policy deleted successfully',
      status: 'success'
  });
}

// export async function testFunction(req: Request, res: Response) {
//   const result = await getSLAComplianceByTicketIdModel(req.params.ticketId, req.params.priorityId);
//   res.json({
//       data: result.rows,
//       message: 'SLA Compliance retrieved successfully',
//       status: 'success'
//   });
// }